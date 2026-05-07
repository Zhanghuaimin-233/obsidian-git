# obsidian-git 汉化手册

## 汉化范围
仅UI界面，包括：
- 命令名称
- 设置界面
- 状态栏
- 模态框
- 源代码控制视图
- 历史视图
- 通知消息

## 汉化策略
直接修改源代码，将英文文本替换为中文。

## 汉化文件列表

### 高优先级
1. `src/commands.ts` - 命令名称
2. `src/setting/settings.ts` - 设置界面
3. `src/constants.ts` - 常量和默认值

### 中优先级
4. `src/statusBar.ts` - 状态栏
5. `src/ui/modals/` - 模态框
6. `src/ui/sourceControl/sourceControl.svelte` - 源代码控制视图
7. `src/ui/history/historyView.svelte` - 历史视图
8. `src/main.ts` - 通知消息

## 汉化对照表

### 命令名称
| 英文 | 中文 |
|------|------|
| Edit .gitignore | 编辑 .gitignore |
| Open source control view | 打开源代码控制视图 |
| Open history view | 打开历史视图 |
| Open diff view | 打开差异视图 |
| Open file on GitHub | 在 GitHub 上打开文件 |
| Open file history on GitHub | 在 GitHub 上打开文件历史 |
| Pull | 拉取 |
| Fetch | 获取 |
| Switch to remote branch | 切换到远程分支 |
| Add file to .gitignore | 添加文件到 .gitignore |
| Commit-and-sync | 提交并同步 |
| Commit-and-sync and then close Obsidian | 提交并同步后关闭 Obsidian |
| Commit-and-sync with specific message | 使用指定消息提交并同步 |
| Commit all changes | 提交所有更改 |
| Commit all changes with specific message | 使用指定消息提交所有更改 |
| Commit | 提交 |
| Commit staged | 提交暂存的更改 |
| Amend staged | 修改暂存的更改 |
| Commit with specific message | 使用指定消息提交 |
| Commit staged with specific message | 使用指定消息提交暂存的更改 |
| Push | 推送 |
| Stage current file | 暂存当前文件 |
| Unstage current file | 取消暂存当前文件 |
| Edit remotes | 编辑远程仓库 |
| Remove remote | 移除远程仓库 |
| Set upstream branch | 设置上游分支 |
| CAUTION: Delete repository | 注意：删除仓库 |
| Initialize a new repo | 初始化新仓库 |
| Clone an existing remote repo | 克隆现有远程仓库 |
| List changed files | 列出已更改的文件 |
| Switch branch | 切换分支 |
| Create new branch | 创建新分支 |
| Delete branch | 删除分支 |
| CAUTION: Discard all changes | 注意：丢弃所有更改 |
| Pause/Resume automatic routines | 暂停/恢复自动任务 |
| Raw command | 原始命令 |
| Toggle line author information | 切换行作者信息 |
| Reset hunk | 重置代码块 |
| Stage hunk | 暂存代码块 |
| Preview hunk | 预览代码块 |
| Go to next hunk | 跳转到下一个代码块 |
| Go to previous hunk | 跳转到上一个代码块 |

### 通知消息
| 英文 | 中文 |
|------|------|
| Successfully deleted repository. Reloading plugin... | 成功删除仓库。正在重新加载插件... |
| No repository found | 未找到仓库 |
| Discarded all changes in tracked files. | 已丢弃所有跟踪文件的更改。 |
| Discarded all files. | 已丢弃所有文件。 |
| Paused automatic routines. | 已暂停自动任务。 |
| Resumed automatic routines. | 已恢复自动任务。 |

### 状态栏
| 英文 | 中文 |
|------|------|
| You have merge conflicts. Resolve them and commit afterwards. | 存在合并冲突。请解决冲突后提交。 |
| Automatic routines are currently paused. | 自动任务当前已暂停。 |
| Checking repository status... | 正在检查仓库状态... |
| Adding files... | 正在添加文件... |
| Committing changes... | 正在提交更改... |
| Pushing changes... | 正在推送更改... |
| Pulling changes... | 正在拉取更改... |
| Failed on initialization! | 初始化失败！ |
| Git is offline | Git 离线 |
| Git is ready | Git 就绪 |
| Last Commit | 最后提交 |
| unpushed commits | 个未推送的提交 |
| Offline: | 离线： |

### 模态框
| 英文 | 中文 |
|------|------|
| Do you really want to delete the repository (.git directory)? plugin action cannot be undone. | 您确定要删除仓库（.git 目录）吗？此操作无法撤销。 |
| Are you sure you want to DELETE the | 您确定要删除 |
| untracked file | 个未跟踪文件 |
| Are you sure you want to discard ALL changes in | 您确定要丢弃所有更改于 |
| tracked file | 个跟踪文件 |
| Delete all | 删除所有 |
| Discard all | 丢弃所有 |
| Cancel | 取消 |
| Enter remote URL | 输入远程 URL |
| Enter directory for clone. It needs to be empty or not existent. | 输入克隆目录。目录需要为空或不存在。 |
| Specify depth of clone. Leave empty for full clone. | 指定克隆深度。留空表示完整克隆。 |
| Does your remote repo contain a | 您的远程仓库是否包含 |
| directory at the root? | 目录在根目录？ |
| DELETE ALL YOUR LOCAL CONFIG AND PLUGINS | 删除所有本地配置和插件 |
| To avoid conflicts, the local | 为避免冲突，本地 |
| directory needs to be deleted. | 目录需要被删除。 |
| Aborted clone | 已中止克隆 |
| Invalid depth. Aborting clone. | 无效深度。正在中止克隆。 |
| Cloning new repo into | 正在克隆新仓库到 |
| Cloned new repo. | 已克隆新仓库。 |
| Please restart Obsidian | 请重启 Obsidian |
| No upstream branch is set. Please select one. | 未设置上游分支。请选择一个。 |
| Aborted. No upstream-branch is set! | 已中止。未设置上游分支！ |
| Set upstream branch to | 已设置上游分支为 |
| This branch isn't merged into HEAD. Force delete? | 此分支未合并到 HEAD。强制删除？ |
| Create new branch | 创建新分支 |
| Delete branch | 删除分支 |
| Initialized new repo | 已初始化新仓库 |
| Pull: Everything is up-to-date | 拉取：所有内容已是最新 |
| No commits to push | 没有要推送的提交 |
| Pushed to remote | 已推送到远程 |
| Pushed | 已推送 |
| file to remote | 个文件到远程 |
| No upstream branch is set. Please select one. | 未设置上游分支。请选择一个。 |
| Fetched from remote | 已从远程获取 |
| Committed | 已提交 |
| approx. | 约 |
| file | 个文件 |
| No changes to commit | 没有要提交的更改 |
| Commit aborted: No commit message provided | 提交已中止：未提供提交消息 |
| Auto backup: Please enter a custom commit message. Leave empty to abort | 自动备份：请输入自定义提交消息。留空将中止 |
| Cannot run git command. Trying to run: | 无法运行 git 命令。尝试运行： |
| Can't find a valid git repository. Please create one via the given command or clone an existing repo. | 找不到有效的 git 仓库。请通过给定命令创建或克隆现有仓库。 |
| Automatic routines are currently paused. | 自动任务当前已暂停。 |
| Initialized new repo | 已初始化新仓库 |
| No repository found | 未找到仓库 |
| Successfully deleted repository. Reloading plugin... | 成功删除仓库。正在重新加载插件... |
| You have conflicts in | 存在冲突于 |
| file | 个文件 |
| Cannot push. You have conflicts in | 无法推送。存在冲突于 |
| Cannot push. You have conflicts | 无法推送。存在冲突 |
| No commits to push | 没有要推送的提交 |
| Pushed to remote | 已推送到远程 |
| Pushed | 已推送 |
| file to remote | 个文件到远程 |
| No upstream branch is set. Please select one. | 未设置上游分支。请选择一个。 |
| Aborted. No upstream-branch is set! | 已中止。未设置上游分支！ |
| Set upstream branch to | 已设置上游分支为 |
| Fetched from remote | 已从远程获取 |
| Committed | 已提交 |
| approx. | 约 |
| file | 个文件 |
| No changes to commit | 没有要提交的更改 |
| Commit aborted: No commit message provided | 提交已中止：未提供提交消息 |
| Auto backup: Please enter a custom commit message. Leave empty to abort | 自动备份：请输入自定义提交消息。留空将中止 |
| Cannot run git command. Trying to run: | 无法运行 git 命令。尝试运行： |
| Can't find a valid git repository. Please create one via the given command or clone an existing repo. | 找不到有效的 git 仓库。请通过给定命令创建或克隆现有仓库。 |
| Automatic routines are currently paused. | 自动任务当前已暂停。 |
| Initialized new repo | 已初始化新仓库 |
| No repository found | 未找到仓库 |
| Successfully deleted repository. Reloading plugin... | 成功删除仓库。正在重新加载插件... |
| You have conflicts in | 存在冲突于 |
| file | 个文件 |
| Cannot push. You have conflicts in | 无法推送。存在冲突于 |
| Cannot push. You have conflicts | 无法推送。存在冲突 |
| No commits to push | 没有要推送的提交 |
| Pushed to remote | 已推送到远程 |
| Pushed | 已推送 |
| file to remote | 个文件到远程 |
| No upstream branch is set. Please select one. | 未设置上游分支。请选择一个。 |
| Aborted. No upstream-branch is set! | 已中止。未设置上游分支！ |
| Set upstream branch to | 已设置上游分支为 |
| Fetched from remote | 已从远程获取 |
| Committed | 已提交 |
| approx. | 约 |
| file | 个文件 |
| No changes to commit | 没有要提交的更改 |
| Commit aborted: No commit message provided | 提交已中止：未提供提交消息 |
| Auto backup: Please enter a custom commit message. Leave empty to abort | 自动备份：请输入自定义提交消息。留空将中止 |
| Cannot run git command. Trying to run: | 无法运行 git 命令。尝试运行： |
| Can't find a valid git repository. Please create one via the given command or clone an existing repo. | 找不到有效的 git 仓库。请通过给定命令创建或克隆现有仓库。 |
| Automatic routines are currently paused. | 自动任务当前已暂停。 |

### 源代码控制视图
| 英文 | 中文 |
|------|------|
| Commit-and-sync | 提交并同步 |
| Commit | 提交 |
| Stage all | 暂存所有 |
| Unstage all | 取消暂存所有 |
| Push | 推送 |
| Pull | 拉取 |
| Change Layout | 更改布局 |
| Refresh | 刷新 |
| Commit Message | 提交消息 |
| Clear | 清除 |
| Staged Changes | 已暂存的更改 |
| Unstage | 取消暂存 |
| Changes | 更改 |
| Discard | 丢弃 |
| Stage | 暂存 |
| Recently Pulled Files | 最近拉取的文件 |

### 历史视图
| 英文 | 中文 |
|------|------|
| Change Layout | 更改布局 |
| Refresh | 刷新 |

### 设置界面
| 英文 | 中文 |
|------|------|
| Git is not ready. When all settings are correct you can configure commit-sync, etc. | Git 未就绪。当所有设置正确时，您可以配置提交同步等。 |
| Automatic | 自动 |
| Split timers for automatic commit and sync | 分离自动提交和同步的计时器 |
| Enable to use one interval for commit and another for sync. | 启用以使用一个间隔进行提交，另一个间隔进行同步。 |
| Auto commit-and-sync interval (minutes) | 自动提交同步间隔（分钟） |
| Auto commit interval (minutes) | 自动提交间隔（分钟） |
| Commit | 提交 |
| Commit and sync | 提交并同步 |
| changes every X minutes. Set to 0 (default) to disable. (See below setting for further configuration!) | 每 X 分钟更改一次。设置为 0（默认）以禁用。（参见下方设置以获取更多配置！） |
| Auto commit-and-sync after stopping file edits | 停止文件编辑后自动提交同步 |
| Auto commit after stopping file edits | 停止文件编辑后自动提交 |
| Requires the commit-and-sync interval not to be 0. | 需要提交同步间隔不为 0。 |
| Requires the commit interval not to be 0. | 需要提交间隔不为 0。 |
| If turned on, do auto commit-and-sync every | 如果开启，每 |
| after stopping file edits. | 后自动提交同步。 |
| after stopping file edits. | 后自动提交。 |
| This also prevents auto commit-and-sync while editing a file. If turned off, it's independent from the last file edit. | 这也会在编辑文件时防止自动提交同步。如果关闭，则与上次文件编辑无关。 |
| This also prevents auto commit while editing a file. If turned off, it's independent from the last file edit. | 这也会在编辑文件时防止自动提交。如果关闭，则与上次文件编辑无关。 |
| Auto commit-and-sync after latest commit | 最新提交后自动提交同步 |
| Auto commit after latest commit | 最新提交后自动提交 |
| If turned on, sets last auto commit-and-sync timestamp to the latest commit timestamp. This reduces the frequency of auto commit-and-sync when doing manual commits. | 如果开启，将上次自动提交同步时间戳设置为最新提交时间戳。这会减少手动提交时自动提交同步的频率。 |
| If turned on, sets last auto commit timestamp to the latest commit timestamp. This reduces the frequency of auto commit when doing manual commits. | 如果开启，将上次自动提交时间戳设置为最新提交时间戳。这会减少手动提交时自动提交的频率。 |
| Auto push interval (minutes) | 自动推送间隔（分钟） |
| Push commits every X minutes. Set to 0 (default) to disable. | 每 X 分钟推送一次提交。设置为 0（默认）以禁用。 |
| Auto pull interval (minutes) | 自动拉取间隔（分钟） |
| Pull changes every X minutes. Set to 0 (default) to disable. | 每 X 分钟拉取一次更改。设置为 0（默认）以禁用。 |
| Auto commit-and-sync only staged files | 仅自动提交同步暂存的文件 |
| Auto commit only staged files | 仅自动提交暂存的文件 |
| If turned on, only staged files are committed on commit-and-sync. If turned off, all changed files are committed. | 如果开启，仅在提交同步时提交暂存的文件。如果关闭，所有更改的文件都会被提交。 |
| If turned on, only staged files are committed on commit. If turned off, all changed files are committed. | 如果开启，仅在提交时提交暂存的文件。如果关闭，所有更改的文件都会被提交。 |
| Specify custom commit message on auto commit-and-sync | 在自动提交同步时指定自定义提交消息 |
| Specify custom commit message on auto commit | 在自动提交时指定自定义提交消息 |
| You will get a pop up to specify your message. | 您将收到一个弹窗来指定您的消息。 |
| Commit message on auto commit-and-sync | 自动提交同步的提交消息 |
| Commit message on auto commit | 自动提交的提交消息 |
| Available placeholders: {{date}} (see below), {{hostname}} (see below), {{numFiles}} (number of changed files in the commit) and {{files}} (changed files in commit message). | 可用占位符：{{date}}（见下文），{{hostname}}（见下文），{{numFiles}}（提交中更改的文件数）和 {{files}}（提交消息中更改的文件）。 |
| Commit message | 提交消息 |
| Commit message on manual commit | 手动提交的提交消息 |
| Available placeholders: {{date}} (see below), {{hostname}} (see below), {{numFiles}} (number of changed files in the commit) and {{files}} (changed files in commit message). Leave empty to require manual input on each commit. | 可用占位符：{{date}}（见下文），{{hostname}}（见下文），{{numFiles}}（提交中更改的文件数）和 {{files}}（提交消息中更改的文件）。留空以要求每次提交时手动输入。 |
| Set to default: | 设置为默认： |
| Commit message script | 提交消息脚本 |
| A script that is run using 'sh -c' to generate the commit message. May be used to generate commit messages using AI tools. Available placeholders: {{hostname}}, {{date}}. | 使用 'sh -c' 运行的脚本，用于生成提交消息。可用于使用 AI 工具生成提交消息。可用占位符：{{hostname}}，{{date}}。 |
| {{date}} placeholder format | {{date}} 占位符格式 |
| Specify custom date format. E.g. | 指定自定义日期格式。例如 |
| See <a href="https://momentjs.com">Moment.js</a> for more formats. | 查看 <a href="https://momentjs.com">Moment.js</a> 以获取更多格式。 |
| {{hostname}} placeholder replacement | {{hostname}} 占位符替换 |
| Specify custom hostname for every device. Defaults to the OS hostname if not set on desktop. | 为每台设备指定自定义主机名。如果未在桌面上设置，则默认为操作系统主机名。 |
| Preview commit message | 预览提交消息 |
| Preview | 预览 |
| List filenames affected by commit in the commit body | 在提交正文中列出受提交影响的文件名 |
| Pull | 拉取 |
| Merge strategy | 合并策略 |
| Decide how to integrate commits from your remote branch into your local branch. | 决定如何将远程分支的提交集成到本地分支。 |
| Merge | 合并 |
| Rebase | 变基 |
| Other sync service (Only updates the HEAD without touching the working directory) | 其他同步服务（仅更新 HEAD 而不接触工作目录） |
| Merge strategy on conflicts | 冲突时的合并策略 |
| Decide how to solve conflicts when pulling remote changes. This can be used to favor your local changes or the remote changes automatically. | 决定在拉取远程更改时如何解决冲突。这可用于自动优先考虑本地更改或远程更改。 |
| None (git default) | 无（git 默认） |
| Our changes | 我们的更改 |
| Their changes | 他们的更改 |
| Pull on startup | 启动时拉取 |
| Automatically pull commits when Obsidian starts. | Obsidian 启动时自动拉取提交。 |
| Commit-and-sync | 提交并同步 |
| Commit-and-sync with default settings means staging everything -> committing -> pulling -> pushing. Ideally this is a single action that you do regularly to keep your local and remote repository in sync. | 使用默认设置的提交并同步意味着暂存所有内容 -> 提交 -> 拉取 -> 推送。理想情况下，这是您定期执行的单个操作，以保持本地和远程仓库同步。 |
| Push on commit-and-sync | 提交并同步时推送 |
| Most of the time you want to push after committing. Turning this off turns a commit-and-sync action into commit | 大多数情况下，您希望在提交后推送。关闭此选项会将提交并同步操作变为仅提交 |
| only. It will still be called commit-and-sync. | 。它仍将被称为提交并同步。 |
| Pull on commit-and-sync | 提交并同步时拉取 |
| On commit-and-sync, pull commits as well. Turning this off turns a commit-and-sync action into commit | 在提交并同步时，也拉取提交。关闭此选项会将提交并同步操作变为仅提交 |
| only. | 。 |
| Hunk management | 代码块管理 |
| Hunks are sections of grouped line changes right in your editor. | 代码块是编辑器中分组行更改的部分。 |
| Signs | 标记 |
| This allows you to see your changes right in your editor via colored markers and stage/reset/preview individual hunks. | 这允许您通过彩色标记在编辑器中查看更改，并暂存/重置/预览单个代码块。 |
| Hunk commands | 代码块命令 |
| Adds commands to stage/reset individual Git diff hunks and navigate between them via 'Go to next/prev hunk' commands. | 添加命令以暂存/重置单个 Git 差异代码块，并通过“跳转到下一个/上一个代码块”命令在它们之间导航。 |
| Status bar with summary of line changes | 状态栏显示行更改摘要 |
| Disabled | 禁用 |
| Colored | 彩色 |
| Monochrome | 单色 |
| Line author information | 行作者信息 |
| History view | 历史视图 |
| Show Author | 显示作者 |
| Show the author of the commit in the history view. | 在历史视图中显示提交的作者。 |
| Hide | 隐藏 |
| Full | 完整 |
| Initials | 首字母 |
| Show Date | 显示日期 |
| Show the date of the commit in the history view. The {{date}} placeholder format is used to display the date. | 在历史视图中显示提交的日期。使用 {{date}} 占位符格式显示日期。 |
| Source control view | 源代码控制视图 |
| Automatically refresh source control view on file changes | 文件更改时自动刷新源代码控制视图 |
| On slower machines this may cause lags. If so, just disable this option. | 在较慢的机器上可能会导致延迟。如果是这样，请禁用此选项。 |
| Source control view refresh interval | 源代码控制视图刷新间隔 |
| Milliseconds to wait after file change before refreshing the Source Control View. | 文件更改后刷新源代码控制视图前等待的毫秒数。 |
| Miscellaneous | 其他 |
| Diff view style | 差异视图样式 |
| Set the style for the diff view. Note that the actual diff in "Split" mode is not generated by Git, but the editor itself instead so it may differ from the diff generated by Git. One advantage of this is that you can edit the text in that view. | 设置差异视图的样式。请注意，“拆分”模式下的实际差异不是由 Git 生成的，而是由编辑器本身生成的，因此可能与 Git 生成的差异不同。这样做的一个优点是您可以在该视图中编辑文本。 |
| Split | 拆分 |
| Unified | 统一 |
| Disable informative notifications | 禁用信息通知 |
| Disable informative notifications for git operations to minimize distraction (refer to status bar for updates). | 禁用 git 操作的信息通知以减少干扰（有关更新，请参阅状态栏）。 |
| Disable error notifications | 禁用错误通知 |
| Disable error notifications of any kind to minimize distraction (refer to status bar for updates). | 禁用任何类型的错误通知以减少干扰（有关更新，请参阅状态栏）。 |
| Hide notifications for no changes | 隐藏无更改通知 |
| Don't show notifications when there are no changes to commit or push. | 当没有要提交或推送的更改时，不显示通知。 |
| Show status bar | 显示状态栏 |
| Obsidian must be restarted for the changes to take affect. | 必须重启 Obsidian 才能使更改生效。 |
| File menu integration | 文件菜单集成 |
| Add "Stage", "Unstage" and "Add to .gitignore" actions to the file menu. | 在文件菜单中添加“暂存”、“取消暂存”和“添加到 .gitignore”操作。 |
| Show branch status bar | 显示分支状态栏 |
| Show the count of modified files in the status bar | 在状态栏中显示修改文件的数量 |
| Authentication/commit author | 认证/提交作者 |
| Commit author | 提交作者 |
| Username on your git server. E.g. your username on GitHub | 您的 git 服务器上的用户名。例如您在 GitHub 上的用户名 |
| Password/Personal access token | 密码/个人访问令牌 |
| Type in your password. You won't be able to see it again. | 输入您的密码。您将无法再次看到它。 |
| Author name for commit | 提交的作者姓名 |
| Author email for commit | 提交的作者邮箱 |
| Advanced | 高级 |
| These settings usually don't need to be changed, but may be required for special setups. | 这些设置通常不需要更改，但可能需要用于特殊设置。 |
| Update submodules | 更新子模块 |
| "Commit-and-sync" and "pull" takes care of submodules. Missing features: Conflicted files, count of pulled/pushed/committed files. Tracking branch needs to be set for each submodule. | “提交并同步”和“拉取”会处理子模块。缺少的功能：冲突文件、拉取/推送/提交文件的数量。需要为每个子模块设置跟踪分支。 |
| Submodule recurse checkout/switch | 子模块递归检出/切换 |
| Whenever a checkout happens on the root repository, recurse the checkout on the submodules (if the branches exist). | 每当在根仓库上发生检出时，递归检出子模块（如果分支存在）。 |
| Custom Git binary path | 自定义 Git 二进制路径 |
| Specify the path to the Git binary/executable. Git should already be in your PATH. Should only be necessary for a custom Git installation. | 指定 Git 二进制/可执行文件的路径。Git 应该已经在您的 PATH 中。仅在自定义 Git 安装时需要。 |
| Additional environment variables | 附加环境变量 |
| Use each line for a new environment variable in the format KEY=VALUE . | 每行使用一个新环境变量，格式为 KEY=VALUE。 |
| Additional PATH environment variable paths | 附加 PATH 环境变量路径 |
| Use each line for one path | 每行使用一个路径 |
| Reload with new environment variables | 使用新环境变量重新加载 |
| Removing previously added environment variables will not take effect until Obsidian is restarted. | 移除先前添加的环境变量在重启 Obsidian 之前不会生效。 |
| Reload | 重新加载 |
| Custom base path (Git repository path) | 自定义基础路径（Git 仓库路径） |
| Sets the relative path to the vault from which the Git binary should be executed. Mostly used to set the path to the Git repository, which is only required if the Git repository is below the vault root directory. Use "\\" instead of "/" on Windows. | 设置从保险库执行 Git 二进制文件的相对路径。主要用于设置 Git 仓库的路径，仅在 Git 仓库位于保险库根目录下方时需要。在 Windows 上使用 "\\" 代替 "/"。 |
| Custom Git directory path (Instead of '.git') | 自定义 Git 目录路径（代替 '.git'） |
| Corresponds to the GIT_DIR environment variable. Requires restart of Obsidian to take effect. Use "\\" instead of "/" on Windows. | 对应于 GIT_DIR 环境变量。需要重启 Obsidian 才能生效。在 Windows 上使用 "\\" 代替 "/"。 |
| Disable on this device | 在此设备上禁用 |
| Disables the plugin on this device. This setting is not synced. | 在此设备上禁用插件。此设置不会同步。 |
| Support | 支持 |
| Donate | 捐赠 |
| If you like this Plugin, consider donating to support continued development. | 如果您喜欢此插件，请考虑捐赠以支持持续开发。 |
| Copy Debug Information | 复制调试信息 |
| Debug information copied to clipboard. May contain sensitive information! | 调试信息已复制到剪贴板。可能包含敏感信息！ |
| Debugging and logging: | 调试和日志记录： |
| You can always see the logs of this and every other plugin by opening the console with | 您始终可以通过打开控制台查看此插件和其他所有插件的日志 |
| Show commit authoring information next to each line | 在每行旁边显示提交作者信息 |
| Only available on desktop currently. | 目前仅在桌面上可用。 |
| Feature guide and quick examples | 功能指南和快速示例 |
| The commit hash, author name and authoring date can all be individually toggled. | 提交哈希、作者姓名和作者日期都可以单独切换。 |
| Hide everything, to only show the age-colored sidebar. | 隐藏所有内容，仅显示年龄着色的侧边栏。 |
| Follow movement and copies across files and commits | 跟踪文件和提交之间的移动和复制 |
| Do not follow (default) | 不跟踪（默认） |
| Follow within same commit | 在同一提交内跟踪 |
| Follow within all commits (maybe slow) | 在所有提交内跟踪（可能较慢） |
| By default (deactivated), each line only shows the newest commit where it was changed. | 默认情况下（停用），每行仅显示更改它的最新提交。 |
| With <i>same commit</i>, cut-copy-paste-ing of text is followed within the same commit and the original commit of authoring will be shown. | 使用<i>同一提交</i>，在同一提交内跟踪文本的剪切-复制-粘贴，并显示原始作者提交。 |
| With <i>all commits</i>, cut-copy-paste-ing text inbetween multiple commits will be detected. | 使用<i>所有提交</i>，将检测多个提交之间的文本剪切-复制-粘贴。 |
| It uses <a href="https://git-scm.com/docs/git-blame">git-blame</a> and for matches (at least | 它使用 <a href="https://git-scm.com/docs/git-blame">git-blame</a> 并且对于匹配（至少 |
| characters) within the same (or all) commit(s), <em>the originating</em> commit's information is shown. | 个字符）在同一（或所有）提交内，显示<em>原始</em>提交的信息。 |
| Show commit hash | 显示提交哈希 |
| Author name display | 作者姓名显示 |
| If and how the author is displayed | 是否以及如何显示作者 |
| Initials (default) | 首字母（默认） |
| First name | 名 |
| Last name | 姓 |
| Full name | 全名 |
| Authoring date display | 作者日期显示 |
| If and how the date and time of authoring the line is displayed | 是否以及如何显示行的作者日期和时间 |
| Date (default) | 日期（默认） |
| Date and time | 日期和时间 |
| Natural language | 自然语言 |
| Custom | 自定义 |
| Show commit authoring information next to each line | 在每行旁边显示提交作者信息 |
| Only available on desktop currently. | 目前仅在桌面上可用。 |
| Feature guide and quick examples | 功能指南和快速示例 |
| The commit hash, author name and authoring date can all be individually toggled. | 提交哈希、作者姓名和作者日期都可以单独切换。 |
| Hide everything, to only show the age-colored sidebar. | 隐藏所有内容，仅显示年龄着色的侧边栏。 |
| Follow movement and copies across files and commits | 跟踪文件和提交之间的移动和复制 |
| Do not follow (default) | 不跟踪（默认） |
| Follow within same commit | 在同一提交内跟踪 |
| Follow within all commits (maybe slow) | 在所有提交内跟踪（可能较慢） |
| By default (deactivated), each line only shows the newest commit where it was changed. | 默认情况下（停用），每行仅显示更改它的最新提交。 |
| With <i>same commit</i>, cut-copy-paste-ing of text is followed within the same commit and the original commit of authoring will be shown. | 使用<i>同一提交</i>，在同一提交内跟踪文本的剪切-复制-粘贴，并显示原始作者提交。 |
| With <i>all commits</i>, cut-copy-paste-ing text inbetween multiple commits will be detected. | 使用<i>所有提交</i>，将检测多个提交之间的文本剪切-复制-粘贴。 |
| It uses <a href="https://git-scm.com/docs/git-blame">git-blame</a> and for matches (at least | 它使用 <a href="https://git-scm.com/docs/git-blame">git-blame</a> 并且对于匹配（至少 |
| characters) within the same (or all) commit(s), <em>the originating</em> commit's information is shown. | 个字符）在同一（或所有）提交内，显示<em>原始</em>提交的信息。 |
| Show commit hash | 显示提交哈希 |
| Author name display | 作者姓名显示 |
| If and how the author is displayed | 是否以及如何显示作者 |
| Initials (default) | 首字母（默认） |
| First name | 名 |
| Last name | 姓 |
| Full name | 全名 |
| Authoring date display | 作者日期显示 |
| If and how the date and time of authoring the line is displayed | 是否以及如何显示行的作者日期和时间 |
| Date (default) | 日期（默认） |
| Date and time | 日期和时间 |
| Natural language | 自然语言 |
| Custom | 自定义 |
