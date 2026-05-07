import { Errors } from "isomorphic-git";
import type { Debouncer, Menu, TAbstractFile, WorkspaceLeaf } from "obsidian";
import {
    debounce,
    FileSystemAdapter,
    MarkdownView,
    normalizePath,
    Notice,
    Platform,
    Plugin,
    TFile,
    TFolder,
    moment,
} from "obsidian";
import * as path from "path";
import * as fsPromises from "fs/promises";
import { pluginRef } from "src/pluginGlobalRef";
import { PromiseQueue } from "src/promiseQueue";
import { ObsidianGitSettingsTab } from "src/setting/settings";
import { StatusBar } from "src/statusBar";
import { CustomMessageModal } from "src/ui/modals/customMessageModal";
import AutomaticsManager from "./automaticsManager";
import { addCommmands } from "./commands";
import {
    CONFLICT_OUTPUT_FILE,
    DEFAULT_SETTINGS,
    DIFF_VIEW_CONFIG,
    HISTORY_VIEW_CONFIG,
    SOURCE_CONTROL_VIEW_CONFIG,
    SPLIT_DIFF_VIEW_CONFIG,
} from "./constants";
import type { GitManager } from "./gitManager/gitManager";
import { IsomorphicGit } from "./gitManager/isomorphicGit";
import { SimpleGit } from "./gitManager/simpleGit";
import { LocalStorageSettings } from "./setting/localStorageSettings";
import Tools from "./tools";
import type {
    FileStatusResult,
    ObsidianGitSettings,
    PluginState,
    Status,
    UnstagedFile,
} from "./types";
import {
    CurrentGitAction,
    mergeSettingsByPriority,
    NoNetworkError,
} from "./types";
import DiffView from "./ui/diff/diffView";
import SplitDiffView from "./ui/diff/splitDiffView";
import HistoryView from "./ui/history/historyView";
import { BranchModal } from "./ui/modals/branchModal";
import { GeneralModal } from "./ui/modals/generalModal";
import GitView from "./ui/sourceControl/sourceControl";
import { BranchStatusBar } from "./ui/statusBar/branchStatusBar";
import {
    assertNever,
    convertPathToAbsoluteGitignoreRule,
    formatRemoteUrl,
    spawnAsync,
    splitRemoteBranch,
} from "./utils";
import { DiscardModal, type DiscardResult } from "./ui/modals/discardModal";
import { HunkActions } from "./editor/signs/hunkActions";
import { EditorIntegration } from "./editor/editorIntegration";

export default class ObsidianGit extends Plugin {
    gitManager: GitManager;
    automaticsManager = new AutomaticsManager(this);
    tools = new Tools(this);
    localStorage = new LocalStorageSettings(this);
    settings: ObsidianGitSettings;
    settingsTab?: ObsidianGitSettingsTab;
    statusBar?: StatusBar;
    branchBar?: BranchStatusBar;
    state: PluginState = {
        gitAction: CurrentGitAction.idle,
        offlineMode: false,
    };
    lastPulledFiles: FileStatusResult[];
    gitReady = false;
    promiseQueue: PromiseQueue = new PromiseQueue(this);

    /**
     * Debouncer for the auto commit after file changes.
     */
    autoCommitDebouncer: Debouncer<[], void> | undefined;
    cachedStatus: Status | undefined;
    // Used to store the path of the file that is currently shown in the diff view.
    lastDiffViewState: Record<string, unknown> | undefined;
    intervalsToClear: number[] = [];
    editorIntegration: EditorIntegration = new EditorIntegration(this);
    hunkActions = new HunkActions(this);

    /**
     * Debouncer for the refresh of the git status for the source control view after file changes.
     */
    debRefresh: Debouncer<[], void>;

    setPluginState(state: Partial<PluginState>): void {
        this.state = Object.assign(this.state, state);
        this.statusBar?.display();
    }

    async updateCachedStatus(): Promise<Status> {
        this.app.workspace.trigger("obsidian-git:loading-status");
        this.cachedStatus = await this.gitManager.status();
        if (this.cachedStatus.conflicted.length > 0) {
            this.localStorage.setConflict(true);
            await this.branchBar?.display();
        } else {
            this.localStorage.setConflict(false);
            await this.branchBar?.display();
        }

        this.app.workspace.trigger(
            "obsidian-git:status-changed",
            this.cachedStatus
        );
        return this.cachedStatus;
    }

    async refresh() {
        if (!this.gitReady) return;

        const gitViews = this.app.workspace.getLeavesOfType(
            SOURCE_CONTROL_VIEW_CONFIG.type
        );
        const historyViews = this.app.workspace.getLeavesOfType(
            HISTORY_VIEW_CONFIG.type
        );

        if (
            this.settings.changedFilesInStatusBar ||
            gitViews.some((leaf) => !(leaf.isDeferred ?? false)) ||
            historyViews.some((leaf) => !(leaf.isDeferred ?? false))
        ) {
            await this.updateCachedStatus().catch((e) => this.displayError(e));
        }

        this.app.workspace.trigger("obsidian-git:refreshed");

        // We don't put a line authoring refresh here, as it would force a re-loading
        // of the line authoring feature - which would lead to a jumpy editor-view in the
        // ui after every rename event.
    }

    refreshUpdatedHead() {}

    async onload() {
        console.log(
            "loading " +
                this.manifest.name +
                " plugin: v" +
                this.manifest.version
        );

        pluginRef.plugin = this;

        this.localStorage.migrate();
        await this.loadSettings();
        await this.migrateSettings();

        this.settingsTab = new ObsidianGitSettingsTab(this.app, this);
        this.addSettingTab(this.settingsTab);

        if (!this.localStorage.getPluginDisabled()) {
            this.registerStuff();

            this.app.workspace.onLayoutReady(() =>
                this.init({ fromReload: false }).catch((e) =>
                    this.displayError(e)
                )
            );
        }
    }

    onExternalSettingsChange() {
        this.reloadSettings().catch((e) => this.displayError(e));
    }

    /** Reloads the settings from disk and applies them by unloading the plugin
     * and initializing it again.
     */
    async reloadSettings(): Promise<void> {
        const previousSettings = JSON.stringify(this.settings);

        await this.loadSettings();

        const newSettings = JSON.stringify(this.settings);

        // Only reload plugin if the settings have actually changed
        if (previousSettings !== newSettings) {
            this.log("Reloading settings");

            this.unloadPlugin();

            await this.init({ fromReload: true });

            this.app.workspace
                .getLeavesOfType(SOURCE_CONTROL_VIEW_CONFIG.type)
                .forEach((leaf) => {
                    if (!(leaf.isDeferred ?? false))
                        return (leaf.view as GitView).reload();
                });

            this.app.workspace
                .getLeavesOfType(HISTORY_VIEW_CONFIG.type)
                .forEach((leaf) => {
                    if (!(leaf.isDeferred ?? false))
                        return (leaf.view as HistoryView).reload();
                });
        }
    }

    /** This method only registers events, views, commands and more.
     *
     * This only needs to be called once since the registered events are
     * unregistered when the plugin is unloaded.
     *
     * This mustn't depend on the plugin's settings.
     */
    registerStuff(): void {
        this.registerEvent(
            this.app.workspace.on("obsidian-git:refresh", () => {
                this.refresh().catch((e) => this.displayError(e));
            })
        );
        this.registerEvent(
            this.app.workspace.on("obsidian-git:head-change", () => {
                this.refreshUpdatedHead();
            })
        );

        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file, source) => {
                this.handleFileMenu(menu, file, source, "file-manu");
            })
        );

        this.registerEvent(
            this.app.workspace.on("obsidian-git:menu", (menu, path, source) => {
                this.handleFileMenu(menu, path, source, "obsidian-git:menu");
            })
        );

        this.registerEvent(
            this.app.workspace.on("active-leaf-change", (leaf) => {
                this.onActiveLeafChange(leaf);
            })
        );
        this.registerEvent(
            this.app.vault.on("modify", () => {
                this.debRefresh();
                this.autoCommitDebouncer?.();
            })
        );
        this.registerEvent(
            this.app.vault.on("delete", () => {
                this.debRefresh();
                this.autoCommitDebouncer?.();
            })
        );
        this.registerEvent(
            this.app.vault.on("create", () => {
                this.debRefresh();
                this.autoCommitDebouncer?.();
            })
        );
        this.registerEvent(
            this.app.vault.on("rename", () => {
                this.debRefresh();
                this.autoCommitDebouncer?.();
            })
        );

        this.registerView(SOURCE_CONTROL_VIEW_CONFIG.type, (leaf) => {
            return new GitView(leaf, this);
        });

        this.registerView(HISTORY_VIEW_CONFIG.type, (leaf) => {
            return new HistoryView(leaf, this);
        });

        this.registerView(DIFF_VIEW_CONFIG.type, (leaf) => {
            return new DiffView(leaf, this);
        });

        this.registerView(SPLIT_DIFF_VIEW_CONFIG.type, (leaf) => {
            return new SplitDiffView(leaf, this);
        });
        this.addRibbonIcon(
            "git-pull-request",
            "打开 Git 源代码控制",
            async () => {
                const leafs = this.app.workspace.getLeavesOfType(
                    SOURCE_CONTROL_VIEW_CONFIG.type
                );
                let leaf: WorkspaceLeaf;
                if (leafs.length === 0) {
                    leaf =
                        this.app.workspace.getRightLeaf(false) ??
                        this.app.workspace.getLeaf();
                    await leaf.setViewState({
                        type: SOURCE_CONTROL_VIEW_CONFIG.type,
                    });
                } else {
                    leaf = leafs.first()!;
                }
                await this.app.workspace.revealLeaf(leaf);
            }
        );

        this.registerHoverLinkSource(SOURCE_CONTROL_VIEW_CONFIG.type, {
            display: "Git 视图",
            defaultMod: true,
        });

        this.editorIntegration.onLoadPlugin();

        this.setRefreshDebouncer();

        addCommmands(this);
    }

    setRefreshDebouncer(): void {
        this.debRefresh?.cancel();
        this.debRefresh = debounce(
            () => {
                if (this.settings.refreshSourceControl) {
                    this.refresh().catch(console.error);
                }
            },
            this.settings.refreshSourceControlTimer,
            true
        );
    }

    async addFileToGitignore(
        filePath: string,
        isFolder?: boolean
    ): Promise<void> {
        const gitRelativePath = this.gitManager.getRelativeRepoPath(
            filePath,
            true
        );
        // Define an absolute rule that can apply only for this item.
        const gitignoreRule = convertPathToAbsoluteGitignoreRule({
            isFolder,
            gitRelativePath,
        });
        await this.app.vault.adapter.append(
            this.gitManager.getRelativeVaultPath(".gitignore"),
            "\n" + gitignoreRule
        );
        this.app.workspace.trigger("obsidian-git:refresh");
    }

    handleFileMenu(
        menu: Menu,
        file: TAbstractFile | string,
        source: string,
        type: "file-manu" | "obsidian-git:menu"
    ): void {
        if (!this.gitReady) return;
        if (!this.settings.showFileMenu) return;
        if (!file) return;
        let filePath: string;
        if (typeof file === "string") {
            filePath = file;
        } else {
            filePath = file.path;
        }

        if (source == "file-explorer-context-menu") {
            menu.addItem((item) => {
                item.setTitle(`Git: 暂存`)
                    .setIcon("plus-circle")
                    .setSection("action")
                    .onClick((_) => {
                        this.promiseQueue.addTask(async () => {
                            if (file instanceof TFile) {
                                await this.stageFile(file);
                            } else {
                                await this.gitManager.stageAll({
                                    dir: this.gitManager.getRelativeRepoPath(
                                        filePath,
                                        true
                                    ),
                                });
                                this.app.workspace.trigger(
                                    "obsidian-git:refresh"
                                );
                            }
                        });
                    });
            });
            menu.addItem((item) => {
                item.setTitle(`Git: 取消暂存`)
                    .setIcon("minus-circle")
                    .setSection("action")
                    .onClick((_) => {
                        this.promiseQueue.addTask(async () => {
                            if (file instanceof TFile) {
                                await this.unstageFile(file);
                            } else {
                                await this.gitManager.unstageAll({
                                    dir: this.gitManager.getRelativeRepoPath(
                                        filePath,
                                        true
                                    ),
                                });

                                this.app.workspace.trigger(
                                    "obsidian-git:refresh"
                                );
                            }
                        });
                    });
            });
            menu.addItem((item) => {
                item.setTitle(`Git: 添加到 .gitignore`)
                    .setIcon("file-x")
                    .setSection("action")
                    .onClick((_) => {
                        this.addFileToGitignore(
                            filePath,
                            file instanceof TFolder
                        ).catch((e) => this.displayError(e));
                    });
            });
        }

        if (source == "git-source-control") {
            menu.addItem((item) => {
                item.setTitle(`Git: 添加到 .gitignore`)
                    .setIcon("file-x")
                    .setSection("action")
                    .onClick((_) => {
                        this.addFileToGitignore(
                            filePath,
                            file instanceof TFolder
                        ).catch((e) => this.displayError(e));
                    });
            });
            const gitManager = this.app.vault.adapter;
            if (
                type === "obsidian-git:menu" &&
                gitManager instanceof FileSystemAdapter
            ) {
                menu.addItem((item) => {
                    item.setTitle("用默认应用打开")
                        .setIcon("arrow-up-right")
                        .setSection("action")
                        .onClick((_) => {
                            this.app.openWithDefaultApp(filePath);
                        });
                });
                menu.addItem((item) => {
                    item.setTitle("在系统资源管理器中显示")
                        .setIcon("arrow-up-right")
                        .setSection("action")
                        .onClick((_) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                            (window as any).electron.shell.showItemInFolder(
                                path.join(gitManager.getBasePath(), filePath)
                            );
                        });
                });
            }
        }
    }

    async migrateSettings(): Promise<void> {
        if (this.settings.mergeOnPull != undefined) {
            this.settings.syncMethod = this.settings.mergeOnPull
                ? "merge"
                : "rebase";
            this.settings.mergeOnPull = undefined;
            await this.saveSettings();
        }
        if (this.settings.autoCommitMessage === undefined) {
            this.settings.autoCommitMessage = this.settings.commitMessage;
            await this.saveSettings();
        }
        if (this.settings.gitPath != undefined) {
            this.localStorage.setGitPath(this.settings.gitPath);
            this.settings.gitPath = undefined;
            await this.saveSettings();
        }
        if (this.settings.username != undefined) {
            this.localStorage.setPassword(this.settings.username);
            this.settings.username = undefined;
            await this.saveSettings();
        }
    }

    unloadPlugin() {
        this.gitReady = false;

        this.editorIntegration.onUnloadPlugin();
        this.automaticsManager.unload();
        this.branchBar?.remove();
        this.statusBar?.remove();
        this.statusBar = undefined;
        this.branchBar = undefined;
        this.gitManager.unload();
        this.promiseQueue.clear();

        for (const interval of this.intervalsToClear) {
            window.clearInterval(interval);
        }
        this.intervalsToClear = [];

        this.debRefresh.cancel();
    }

    onunload() {
        this.unloadPlugin();

        console.log("unloading " + this.manifest.name + " plugin");
    }

    async loadSettings() {
        // At first startup, `data` is `null` because data.json does not exist.
        let data = (await this.loadData()) as ObsidianGitSettings | null;
        //Check for existing settings
        if (data == undefined) {
            data = <ObsidianGitSettings>{ showedMobileNotice: true };
        }
        this.settings = mergeSettingsByPriority(DEFAULT_SETTINGS, data);
    }

    async saveSettings() {
        this.settingsTab?.beforeSaveSettings();
        await this.saveData(this.settings);
    }

    get useSimpleGit(): boolean {
        return Platform.isDesktopApp;
    }

    async init({ fromReload = false }): Promise<void> {
        if (this.settings.showStatusBar && !this.statusBar) {
            const statusBarEl = this.addStatusBarItem();
            this.statusBar = new StatusBar(statusBarEl, this);
            this.intervalsToClear.push(
                window.setInterval(() => this.statusBar?.display(), 1000)
            );
        }

        try {
            if (this.useSimpleGit) {
                this.gitManager = new SimpleGit(this);
                await (this.gitManager as SimpleGit).setGitInstance();
            } else {
                this.gitManager = new IsomorphicGit(this);
            }

            const result = await this.gitManager.checkRequirements();
            const pausedAutomatics = this.localStorage.getPausedAutomatics();
            switch (result) {
                case "missing-git":
                    this.displayError(
                        `无法运行 git 命令。尝试运行：'${this.localStorage.getGitPath() || "git"}' 。`
                    );
                    break;
                case "missing-repo":
                    new Notice(
                        "找不到有效的 git 仓库。请通过给定命令创建或克隆现有仓库。",
                        10000
                    );
                    break;
                case "valid":
                    this.gitReady = true;
                    this.setPluginState({ gitAction: CurrentGitAction.idle });

                    if (
                        Platform.isDesktop &&
                        this.settings.showBranchStatusBar &&
                        !this.branchBar
                    ) {
                        const branchStatusBarEl = this.addStatusBarItem();
                        this.branchBar = new BranchStatusBar(
                            branchStatusBarEl,
                            this
                        );
                        this.intervalsToClear.push(
                            window.setInterval(
                                () =>
                                    void this.branchBar
                                        ?.display()
                                        .catch(console.error),
                                60000
                            )
                        );
                    }
                    await this.branchBar?.display();

                    this.editorIntegration.onReady();

                    this.app.workspace.trigger("obsidian-git:refresh");
                    /// Among other things, this notifies the history view that git is ready
                    this.app.workspace.trigger("obsidian-git:head-change");

                    if (
                        !fromReload &&
                        this.settings.autoPullOnBoot &&
                        !pausedAutomatics
                    ) {
                        this.promiseQueue.addTask(() =>
                            this.pullChangesFromRemote()
                        );
                    }

                    if (!pausedAutomatics) {
                        await this.automaticsManager.init();
                    }

                    if (pausedAutomatics) {
                        new Notice("自动任务当前已暂停。");
                    }

                    break;
                default:
                    this.log(
                        "Something weird happened. The 'checkRequirements' result is " +
                            /* eslint-disable-next-line @typescript-eslint/restrict-plus-operands */
                            result
                    );
            }
        } catch (error) {
            this.displayError(error);
            console.error(error);
        }
    }

    async createNewRepo() {
        try {
            await this.gitManager.init();
            new Notice("已初始化新仓库");
            await this.init({ fromReload: true });
        } catch (e) {
            this.displayError(e);
        }
    }

    async cloneNewRepo() {
        const modal = new GeneralModal(this, {
            placeholder: "输入远程 URL",
        });
        const url = await modal.openAndGetResult();
        if (url) {
            const confirmOption = "保险库根目录";
            let dir = await new GeneralModal(this, {
                options:
                    this.gitManager instanceof IsomorphicGit
                        ? [confirmOption]
                        : [],
                placeholder:
                    "输入克隆目录。目录需要为空或不存在。",
                allowEmpty: this.gitManager instanceof IsomorphicGit,
            }).openAndGetResult();
            if (dir == undefined) return;
            if (dir === confirmOption) {
                dir = ".";
            }

            dir = normalizePath(dir);
            if (dir === "/") {
                dir = ".";
            }

            if (dir === ".") {
                const modal = new GeneralModal(this, {
                    options: ["否", "是"],
                    placeholder: `您的远程仓库是否在根目录包含 ${this.app.vault.configDir} 目录？`,
                    onlySelection: true,
                });
                const containsConflictDir = await modal.openAndGetResult();
                if (containsConflictDir === undefined) {
                    new Notice("已中止克隆");
                    return;
                } else if (containsConflictDir === "是") {
                    const confirmOption =
                        "删除所有本地配置和插件";
                    const modal = new GeneralModal(this, {
                        options: ["中止克隆", confirmOption],
                        placeholder: `为避免冲突，本地 ${this.app.vault.configDir} 目录需要被删除。`,
                        onlySelection: true,
                    });
                    const shouldDelete =
                        (await modal.openAndGetResult()) === confirmOption;
                    if (shouldDelete) {
                        await this.app.vault.adapter.rmdir(
                            this.app.vault.configDir,
                            true
                        );
                    } else {
                        new Notice("已中止克隆");
                        return;
                    }
                }
            }
            const depth = await new GeneralModal(this, {
                placeholder:
                    "指定克隆深度。留空表示完整克隆。",
                allowEmpty: true,
            }).openAndGetResult();
            let depthInt = undefined;
            if (depth === undefined) {
                new Notice("已中止克隆");
                return;
            }

            if (depth !== "") {
                depthInt = parseInt(depth);
                if (isNaN(depthInt)) {
                    new Notice("无效深度。正在中止克隆。");
                    return;
                }
            }
            new Notice(`正在克隆新仓库到 "${dir}"`);
            const oldBase = this.settings.basePath;
            const customDir = dir && dir !== ".";
            //Set new base path before clone to ensure proper .git/index file location in isomorphic-git
            if (customDir) {
                this.settings.basePath = dir;
            }
            try {
                await this.gitManager.clone(
                    formatRemoteUrl(url),
                    dir,
                    depthInt
                );
                new Notice("已克隆新仓库。");
                new Notice("请重启 Obsidian");

                if (customDir) {
                    await this.saveSettings();
                }
            } catch (error) {
                this.displayError(error);
                this.settings.basePath = oldBase;
                await this.saveSettings();
            }
        }
    }

    /**
     * Retries to call `this.init()` if necessary, otherwise returns directly
     * @returns true if `this.gitManager` is ready to be used, false if not.
     */
    async isAllInitialized(): Promise<boolean> {
        if (!this.gitReady) {
            await this.init({ fromReload: true });
        }
        return this.gitReady;
    }

    ///Used for command
    async pullChangesFromRemote(): Promise<void> {
        if (!(await this.isAllInitialized())) return;

        const filesUpdated = await this.pull();
        if (filesUpdated === false) {
            return;
        }
        if (!filesUpdated) {
            this.displayMessage("拉取：所有内容已是最新");
        }

        if (this.gitManager instanceof SimpleGit) {
            const status = await this.updateCachedStatus();
            if (status.conflicted.length > 0) {
                this.displayError(
                    `存在 ${status.conflicted.length} 个文件冲突`
                );
                await this.handleConflict(status.conflicted);
            }
        }

        this.app.workspace.trigger("obsidian-git:refresh");
        this.setPluginState({ gitAction: CurrentGitAction.idle });
    }

    async commitAndSync({
        fromAutoBackup,
        requestCustomMessage = false,
        commitMessage,
        onlyStaged = false,
    }: {
        fromAutoBackup: boolean;
        requestCustomMessage?: boolean;
        commitMessage?: string;
        onlyStaged?: boolean;
    }): Promise<void> {
        if (!(await this.isAllInitialized())) return;

        if (
            this.settings.syncMethod == "reset" &&
            this.settings.pullBeforePush
        ) {
            await this.pull();
        }

        const commitSuccessful = await this.commit({
            fromAuto: fromAutoBackup,
            requestCustomMessage,
            commitMessage,
            onlyStaged,
        });
        if (!commitSuccessful) {
            return;
        }

        if (
            this.settings.syncMethod != "reset" &&
            this.settings.pullBeforePush
        ) {
            await this.pull();
        }

        if (!this.settings.disablePush) {
            // Prevent trying to push every time. Only if unpushed commits are present
            if (
                (await this.remotesAreSet()) &&
                (await this.gitManager.canPush())
            ) {
                await this.push();
            } else {
                this.displayMessage("没有要推送的提交");
            }
        }
        this.setPluginState({ gitAction: CurrentGitAction.idle });
    }

    // Returns true if commit was successfully
    async commit({
        fromAuto,
        requestCustomMessage = false,
        onlyStaged = false,
        commitMessage,
        amend = false,
    }: {
        fromAuto: boolean;
        requestCustomMessage?: boolean;
        onlyStaged?: boolean;
        commitMessage?: string;
        amend?: boolean;
    }): Promise<boolean> {
        if (!(await this.isAllInitialized())) return false;
        try {
            let hadConflict = this.localStorage.getConflict();

            let status: Status | undefined;
            let stagedFiles: { vaultPath: string; path: string }[] = [];
            let unstagedFiles: (UnstagedFile & { vaultPath: string })[] = [];

            if (this.gitManager instanceof SimpleGit) {
                await this.mayDeleteConflictFile();
                status = await this.updateCachedStatus();

                //Should not be necessary, but just in case
                if (status.conflicted.length == 0) {
                    hadConflict = false;
                }

                // check for conflict files on auto backup
                if (fromAuto && status.conflicted.length > 0) {
                    this.displayError(
                        `未提交，因为存在 ${status.conflicted.length} 个文件冲突。请解决冲突后使用命令提交。`
                    );
                    await this.handleConflict(status.conflicted);
                    return false;
                }
                stagedFiles = status.staged;

                // This typecast is only needed to hide the fact that `type` is missing, but that is only needed for isomorphic-git
                unstagedFiles = status.changed as unknown as (UnstagedFile & {
                    vaultPath: string;
                })[];
            } else {
                // isomorphic-git section

                if (fromAuto && hadConflict) {
                    // isomorphic-git doesn't have a way to detect current
                    // conflicts, they are only detected on commit
                    //
                    // Conflicts should only be resolved by manually committing.
                    this.displayError(
                        `未提交，因为存在冲突。请解决冲突后使用命令提交。`
                    );
                    return false;
                } else {
                    if (hadConflict) {
                        await this.mayDeleteConflictFile();
                    }
                    const gitManager = this.gitManager as IsomorphicGit;
                    if (onlyStaged) {
                        stagedFiles = await gitManager.getStagedFiles();
                    } else {
                        const res = await gitManager.getUnstagedFiles();
                        unstagedFiles = res.map(({ path, type }) => ({
                            vaultPath:
                                this.gitManager.getRelativeVaultPath(path),
                            path,
                            type,
                        }));
                    }
                }
            }

            if (
                await this.tools.hasTooBigFiles(
                    onlyStaged
                        ? stagedFiles
                        : [...stagedFiles, ...unstagedFiles]
                )
            ) {
                this.setPluginState({ gitAction: CurrentGitAction.idle });
                return false;
            }

            if (
                unstagedFiles.length + stagedFiles.length !== 0 ||
                hadConflict
            ) {
                // The commit message from settings or previously set in the
                // source control view
                let cmtMessage = (commitMessage ??= fromAuto
                    ? this.settings.autoCommitMessage
                    : this.settings.commitMessage);

                // Optionally ask the user via a modal for a commit message
                if (
                    (fromAuto && this.settings.customMessageOnAutoBackup) ||
                    requestCustomMessage
                ) {
                    if (!this.settings.disablePopups && fromAuto) {
                        new Notice(
                            "自动备份：请输入自定义提交消息。留空将中止"
                        );
                    }
                    const modalMessage = await new CustomMessageModal(
                        this
                    ).openAndGetResult();

                    if (
                        modalMessage != undefined &&
                        modalMessage != "" &&
                        modalMessage != "..."
                    ) {
                        cmtMessage = modalMessage;
                    } else {
                        this.setPluginState({
                            gitAction: CurrentGitAction.idle,
                        });
                        return false;
                    }

                    // On desktop may run a script to get the commit message
                } else if (
                    this.gitManager instanceof SimpleGit &&
                    this.settings.commitMessageScript
                ) {
                    const templateScript = this.settings.commitMessageScript;
                    const hostname = this.localStorage.getHostname() || "";
                    let formattedScript = templateScript.replace(
                        "{{hostname}}",
                        hostname
                    );

                    formattedScript = formattedScript.replace(
                        "{{date}}",
                        moment().format(this.settings.commitDateFormat)
                    );
                    let shPath = "sh";
                    if (Platform.isWin) {
                        shPath =
                            process.env.PROGRAMFILES + "\\Git\\bin\\sh.exe";
                        let shExists = false;
                        try {
                            await fsPromises.access(
                                shPath,
                                fsPromises.constants.X_OK
                            );
                            shExists = true;
                        } catch {
                            shExists = false;
                        }

                        if (!shExists) {
                            this.displayError(
                                `无法在 ${shPath} 找到 sh.exe。请确保 Git 已正确安装。`
                            );
                            return false;
                        }
                    }

                    const res = await spawnAsync(
                        shPath,
                        ["-c", formattedScript],
                        { cwd: this.gitManager.absoluteRepoPath }
                    );
                    if (res.code != 0) {
                        this.displayError(res.stderr);
                    } else if (res.stdout.trim().length == 0) {
                        this.displayMessage(
                            "提交消息脚本的输出为空。使用默认消息。"
                        );
                    } else {
                        cmtMessage = res.stdout;
                    }
                }

                // Check if commit message is empty after all processing
                if (!cmtMessage || cmtMessage.trim() === "") {
                    new Notice("提交已中止：未提供提交消息");
                    this.setPluginState({
                        gitAction: CurrentGitAction.idle,
                    });
                    return false;
                }

                let committedFiles: number | undefined;
                if (onlyStaged) {
                    committedFiles = await this.gitManager.commit({
                        message: cmtMessage,
                        amend,
                    });
                } else {
                    committedFiles = await this.gitManager.commitAll({
                        message: cmtMessage,
                        status,
                        unstagedFiles,
                        amend,
                    });
                }

                // Handle eventually resolved conflicts
                if (this.gitManager instanceof SimpleGit) {
                    await this.updateCachedStatus();
                }

                let roughly = false;
                if (committedFiles === undefined) {
                    roughly = true;
                    committedFiles =
                        unstagedFiles.length + stagedFiles.length || 0;
                }
                this.displayMessage(
                    `已提交${roughly ? " 约" : ""} ${committedFiles} 个文件`
                );
            } else {
                this.displayMessage("没有要提交的更改");
            }
            this.app.workspace.trigger("obsidian-git:refresh");

            return true;
        } catch (error) {
            this.displayError(error);
            return false;
        }
    }

    /*
     * Returns true if push was successful
     */
    async push(): Promise<boolean> {
        if (!(await this.isAllInitialized())) return false;
        if (!(await this.remotesAreSet())) {
            return false;
        }
        const hadConflict = this.localStorage.getConflict();
        try {
            if (this.gitManager instanceof SimpleGit)
                await this.mayDeleteConflictFile();

            // Refresh because of pull
            let status: Status;
            if (
                this.gitManager instanceof SimpleGit &&
                (status = await this.updateCachedStatus()).conflicted.length > 0
            ) {
                this.displayError(
                    `无法推送。存在 ${status.conflicted.length} 个文件冲突`
                );
                await this.handleConflict(status.conflicted);
                return false;
            } else if (
                this.gitManager instanceof IsomorphicGit &&
                hadConflict
            ) {
                this.displayError(`无法推送。存在冲突`);
                return false;
            }
            this.log("Pushing....");
            const pushedFiles = await this.gitManager.push();

                if (pushedFiles !== undefined) {
                if (pushedFiles === null) {
                    this.displayMessage(`已推送到远程`);
                } else if (pushedFiles > 0) {
                    this.displayMessage(
                        `已推送 ${pushedFiles} 个文件到远程`
                    );
                } else {
                    this.displayMessage(`没有要推送的提交`);
                }
            }
            this.setPluginState({ offlineMode: false });
            this.app.workspace.trigger("obsidian-git:refresh");
            return true;
        } catch (e) {
            if (e instanceof NoNetworkError) {
                this.handleNoNetworkError(e);
            } else {
                this.displayError(e);
            }
            return false;
        }
    }

    /** Used for internals
     *  Returns whether the pull added a commit or not.
     *
     *  See {@link pullChangesFromRemote} for the command version.
     */
    async pull(): Promise<false | number> {
        if (!(await this.remotesAreSet())) {
            return false;
        }
        try {
            this.log("Pulling....");
            const pulledFiles = (await this.gitManager.pull()) || [];
            this.setPluginState({ offlineMode: false });

            if (pulledFiles.length > 0) {
                this.displayMessage(
                    `从远程拉取了 ${pulledFiles.length} 个文件`
                );
                this.lastPulledFiles = pulledFiles;
            }
            return pulledFiles.length;
        } catch (e) {
            this.displayError(e);

            return false;
        }
    }

    async fetch(): Promise<void> {
        if (!(await this.remotesAreSet())) {
            return;
        }
        try {
            await this.gitManager.fetch();

            this.displayMessage(`已从远程获取`);
            this.setPluginState({ offlineMode: false });
            this.app.workspace.trigger("obsidian-git:refresh");
        } catch (error) {
            this.displayError(error);
        }
    }

    async mayDeleteConflictFile(): Promise<void> {
        const file = this.app.vault.getAbstractFileByPath(CONFLICT_OUTPUT_FILE);
        if (file) {
            this.app.workspace.iterateAllLeaves((leaf) => {
                if (
                    leaf.view instanceof MarkdownView &&
                    leaf.view.file?.path == file.path
                ) {
                    leaf.detach();
                }
            });
            await this.app.vault.delete(file);
        }
    }

    async stageFile(file: TFile): Promise<boolean> {
        if (!(await this.isAllInitialized())) return false;

        await this.gitManager.stage(file.path, true);

        this.app.workspace.trigger("obsidian-git:refresh");

        this.setPluginState({ gitAction: CurrentGitAction.idle });
        return true;
    }

    async unstageFile(file: TFile): Promise<boolean> {
        if (!(await this.isAllInitialized())) return false;

        await this.gitManager.unstage(file.path, true);

        this.app.workspace.trigger("obsidian-git:refresh");

        this.setPluginState({ gitAction: CurrentGitAction.idle });
        return true;
    }

    async switchBranch(): Promise<string | undefined> {
        if (!(await this.isAllInitialized())) return;

        const branchInfo = await this.gitManager.branchInfo();
        const selectedBranch = await new BranchModal(
            this,
            branchInfo.branches
        ).openAndGetReslt();

        if (selectedBranch != undefined) {
            await this.gitManager.checkout(selectedBranch);
            this.displayMessage(`已切换到 ${selectedBranch}`);
            this.app.workspace.trigger("obsidian-git:refresh");
            await this.branchBar?.display();
            return selectedBranch;
        }
    }

    async switchRemoteBranch(): Promise<string | undefined> {
        if (!(await this.isAllInitialized())) return;

        const selectedBranch = (await this.selectRemoteBranch()) || "";

        const [remote, branch] = splitRemoteBranch(selectedBranch);

        if (branch != undefined && remote != undefined) {
            await this.gitManager.checkout(branch, remote);
            this.displayMessage(`已切换到 ${selectedBranch}`);
            await this.branchBar?.display();
            return selectedBranch;
        }
    }

    async createBranch(): Promise<string | undefined> {
        if (!(await this.isAllInitialized())) return;

        const newBranch = await new GeneralModal(this, {
            placeholder: "创建新分支",
        }).openAndGetResult();
        if (newBranch != undefined) {
            await this.gitManager.createBranch(newBranch);
            this.displayMessage(`已创建新分支 ${newBranch}`);
            await this.branchBar?.display();
            return newBranch;
        }
    }

    async deleteBranch(): Promise<string | undefined> {
        if (!(await this.isAllInitialized())) return;

        const branchInfo = await this.gitManager.branchInfo();
        if (branchInfo.current) branchInfo.branches.remove(branchInfo.current);
        const branch = await new GeneralModal(this, {
            options: branchInfo.branches,
            placeholder: "删除分支",
            onlySelection: true,
        }).openAndGetResult();
        if (branch != undefined) {
            let force = false;
            const merged = await this.gitManager.branchIsMerged(branch);
            // Using await inside IF throws exception
            if (!merged) {
                const forceAnswer = await new GeneralModal(this, {
                    options: ["是", "否"],
                    placeholder:
                        "此分支未合并到 HEAD。强制删除？",
                    onlySelection: true,
                }).openAndGetResult();
                if (forceAnswer !== "是") {
                    return;
                }
                force = forceAnswer === "是";
            }
            await this.gitManager.deleteBranch(branch, force);
            this.displayMessage(`已删除分支 ${branch}`);
            await this.branchBar?.display();
            return branch;
        }
    }

    /** Ensures that the upstream branch is set.
     * If not, it will prompt the user to set it.
     *
     * An exception is when the user has submodules enabled.
     * In this case, the upstream branch is not required,
     * to allow pulling/pushing only the submodules and not the outer repo.
     */
    async remotesAreSet(): Promise<boolean> {
        if (this.settings.updateSubmodules) {
            return true;
        }
        if (
            this.gitManager instanceof SimpleGit &&
            (await this.gitManager.getConfig("push.autoSetupRemote", "all")) ==
                "true"
        ) {
            return true;
        }
        if (!(await this.gitManager.branchInfo()).tracking) {
            new Notice("未设置上游分支。请选择一个。");
            return await this.setUpstreamBranch();
        }
        return true;
    }

    async setUpstreamBranch(): Promise<boolean> {
        const remoteBranch = await this.selectRemoteBranch();

        if (remoteBranch == undefined) {
            this.displayError("已中止。未设置上游分支！", 10000);
            this.setPluginState({ gitAction: CurrentGitAction.idle });
            return false;
        } else {
            await this.gitManager.updateUpstreamBranch(remoteBranch);
            this.displayMessage(`已设置上游分支为 ${remoteBranch}`);
            this.setPluginState({ gitAction: CurrentGitAction.idle });
            return true;
        }
    }

    async discardAll(path?: string): Promise<DiscardResult> {
        if (!(await this.isAllInitialized())) return false;

        const status = await this.gitManager.status({ path });

        let filesToDeleteCount = 0;
        let filesToDiscardCount = 0;
        for (const file of status.changed) {
            if (file.workingDir == "U") {
                filesToDeleteCount++;
            } else {
                filesToDiscardCount++;
            }
        }
        if (filesToDeleteCount + filesToDiscardCount == 0) {
            return false;
        }

        const result = await new DiscardModal({
            app: this.app,
            filesToDeleteCount,
            filesToDiscardCount,
            path: path ?? "",
        }).openAndGetResult();

        switch (result) {
            case false:
                return result;
            case "discard":
                await this.gitManager.discardAll({
                    dir: path,
                    status: this.cachedStatus,
                });
                break;
            case "delete": {
                await this.gitManager.discardAll({
                    dir: path,
                    status: this.cachedStatus,
                });
                const untrackedPaths = await this.gitManager.getUntrackedPaths({
                    path,
                    status: this.cachedStatus,
                });
                for (const file of untrackedPaths) {
                    const vaultPath =
                        this.gitManager.getRelativeVaultPath(file);
                    const tFile =
                        this.app.vault.getAbstractFileByPath(vaultPath);

                    if (tFile) {
                        await this.app.fileManager.trashFile(tFile);
                    } else {
                        if (file.endsWith("/")) {
                            await this.app.vault.adapter.rmdir(vaultPath, true);
                        } else {
                            await this.app.vault.adapter.remove(vaultPath);
                        }
                    }
                }
                break;
            }
            default:
                assertNever(result);
        }
        this.app.workspace.trigger("obsidian-git:refresh");
        return result;
    }

    async handleConflict(conflicted?: string[]): Promise<void> {
        this.localStorage.setConflict(true);
        let lines: string[] | undefined;
        if (conflicted !== undefined) {
            lines = [
                "# 冲突",
                "请解决冲突并使用命令 `Git: 提交所有更改` 然后 `Git: 推送` 提交",
                "（此文件将在提交前自动删除）",
                "[[#附加说明]] 可在文件列表下方查看",
                "",
                ...conflicted.map((e) => {
                    const file = this.app.vault.getAbstractFileByPath(e);
                    if (file instanceof TFile) {
                        const link = this.app.metadataCache.fileToLinktext(
                            file,
                            "/"
                        );
                        return `- [[${link}]]`;
                    } else {
                        return `- 不是文件：${e}`;
                    }
                }),
                `
# 附加说明
我强烈建议使用"源代码模式"查看冲突文件。对于简单的冲突，在上面列出的每个文件中，将以下文本块替换为所需的文本。

\`\`\`diff
<<<<<<< HEAD
    本地仓库中的文件更改
=======
    远程仓库中的文件更改
>>>>>>> origin/main
\`\`\``,
            ];
        }
        await this.tools.writeAndOpenFile(lines?.join("\n"));
    }

    async editRemotes(): Promise<string | undefined> {
        if (!(await this.isAllInitialized())) return;

        const remotes = await this.gitManager.getRemotes();

        const nameModal = new GeneralModal(this, {
            options: remotes,
            placeholder:
                "通过输入名称并选择来选择或创建新的远程仓库",
        });
        const remoteName = await nameModal.openAndGetResult();

        if (remoteName) {
            const oldUrl = await this.gitManager.getRemoteUrl(remoteName);

            const urlModal = new GeneralModal(this, {
                initialValue: oldUrl,
                placeholder: "输入远程 URL",
            });
            // urlModal.inputEl.setText(oldUrl ?? "");
            const remoteURL = await urlModal.openAndGetResult();
            if (remoteURL) {
                await this.gitManager.setRemote(
                    remoteName,
                    formatRemoteUrl(remoteURL)
                );
                return remoteName;
            }
        }
    }

    async selectRemoteBranch(): Promise<string | undefined> {
        let remotes = await this.gitManager.getRemotes();
        let selectedRemote: string | undefined;
        if (remotes.length === 0) {
            selectedRemote = await this.editRemotes();
            if (selectedRemote == undefined) {
                remotes = await this.gitManager.getRemotes();
            }
        }

        const nameModal = new GeneralModal(this, {
            options: remotes,
            placeholder:
                "通过输入名称并选择来选择或创建新的远程仓库",
        });
        const remoteName =
            selectedRemote ?? (await nameModal.openAndGetResult());

        if (remoteName) {
            this.displayMessage("正在获取远程分支");
            await this.gitManager.fetch(remoteName);
            const branches =
                await this.gitManager.getRemoteBranches(remoteName);
            const branchModal = new GeneralModal(this, {
                options: branches,
                placeholder:
                    "通过输入名称并选择来选择或创建新的远程分支",
            });
            const branch = await branchModal.openAndGetResult();
            if (branch == undefined) return;
            if (!branch.startsWith(remoteName + "/")) {
                // If the branch does not start with the remote name, prepend it
                return `${remoteName}/${branch}`;
            }
            return branch; // Already in the correct format
        }
    }

    async removeRemote() {
        if (!(await this.isAllInitialized())) return;

        const remotes = await this.gitManager.getRemotes();

        const nameModal = new GeneralModal(this, {
            options: remotes,
            placeholder: "选择远程仓库",
        });
        const remoteName = await nameModal.openAndGetResult();

        if (remoteName) {
            await this.gitManager.removeRemote(remoteName);
        }
    }

    onActiveLeafChange(leaf: WorkspaceLeaf | null): void {
        const view = leaf?.view;
        // Prevent removing focus when switching to other panes than file panes like search or GitView
        if (
            !view?.getState().file &&
            !(view instanceof DiffView || view instanceof SplitDiffView)
        )
            return;

        const sourceControlLeaf = this.app.workspace
            .getLeavesOfType(SOURCE_CONTROL_VIEW_CONFIG.type)
            .first();
        const historyLeaf = this.app.workspace
            .getLeavesOfType(HISTORY_VIEW_CONFIG.type)
            .first();

        // Clear existing active state
        sourceControlLeaf?.view.containerEl
            .querySelector(`div.tree-item-self.is-active`)
            ?.removeClass("is-active");
        historyLeaf?.view.containerEl
            .querySelector(`div.tree-item-self.is-active`)
            ?.removeClass("is-active");

        if (
            leaf?.view instanceof DiffView ||
            leaf?.view instanceof SplitDiffView
        ) {
            const path = leaf.view.state.bFile;
            const escapedPath = path.replace(/["\\]/g, "\\$&");
            this.lastDiffViewState = leaf.view.getState();
            let el: Element | undefined | null;
            if (sourceControlLeaf && leaf.view.state.aRef == "HEAD") {
                el = sourceControlLeaf.view.containerEl.querySelector(
                    `div.staged div.tree-item-self[data-path="${escapedPath}"]`
                );
            } else if (sourceControlLeaf && leaf.view.state.aRef == "") {
                el = sourceControlLeaf.view.containerEl.querySelector(
                    `div.changes div.tree-item-self[data-path="${escapedPath}"]`
                );
            } else if (historyLeaf) {
                el = historyLeaf.view.containerEl.querySelector(
                    `div.tree-item-self[data-path='${escapedPath}']`
                );
            }
            el?.addClass("is-active");
        } else {
            this.lastDiffViewState = undefined;
        }
    }

    handleNoNetworkError(_: NoNetworkError): void {
        if (!this.state.offlineMode) {
            this.displayError(
                "Git：进入离线模式。未来的网络错误将不再显示。",
                2000
            );
        } else {
            this.log("遇到网络错误，但已处于离线模式");
        }
        this.setPluginState({
            gitAction: CurrentGitAction.idle,
            offlineMode: true,
        });
    }

    // region: displaying / formatting messages
    displayMessage(message: string, timeout: number = 4 * 1000): void {
        this.statusBar?.displayMessage(message.toLowerCase(), timeout);

        if (!this.settings.disablePopups) {
            if (
                !this.settings.disablePopupsForNoChanges ||
                !message.startsWith("没有更改")
            ) {
                new Notice(message, 5 * 1000);
            }
        }

        this.log(message);
    }

    displayError(data: unknown, timeout: number = 10 * 1000): void {
        if (data instanceof Errors.UserCanceledError) {
            new Notice("已中止");
            return;
        }
        let error: Error;
        if (data instanceof Error) {
            error = data;
        } else {
            error = new Error(String(data));
        }

        this.setPluginState({ gitAction: CurrentGitAction.idle });
        if (this.settings.showErrorNotices) {
            new Notice(error.message, timeout);
        }
        console.error(`${this.manifest.id}:`, error.stack);
        this.statusBar?.displayMessage(error.message.toLowerCase(), timeout);
    }

    log(...data: unknown[]) {
        console.log(`${this.manifest.id}:`, ...data);
    }
}
