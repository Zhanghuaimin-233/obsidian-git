import type { App } from "obsidian";
import { Modal } from "obsidian";
import { plural } from "src/utils";

export type DiscardResult = false | "delete" | "discard";

export class DiscardModal extends Modal {
    path: string;
    deleteCount: number;
    discardCount: number;
    constructor({
        app,
        path,
        filesToDeleteCount,
        filesToDiscardCount,
    }: {
        app: App;
        path: string;
        filesToDeleteCount: number;
        filesToDiscardCount: number;
    }) {
        super(app);
        this.path = path;
        this.deleteCount = filesToDeleteCount;
        this.discardCount = filesToDiscardCount;
    }
    resolve: ((value: DiscardResult) => void) | null = null;

    /**
     * @returns the result of the modal, whcih can be:
     *   - `false` if the user canceled the modal
     *   - `"delete"` if the user chose to delete all files. In case there are also tracked files, they will be discarded as well.
     *   - `"discard"` if the user chose to discard all tracked files. Untracked files will not be deleted.
     */
    openAndGetResult(): Promise<DiscardResult> {
        this.open();
        return new Promise<DiscardResult>((resolve) => {
            this.resolve = resolve;
        });
    }

    onOpen() {
        const sum = this.deleteCount + this.discardCount;
        const { contentEl, titleEl } = this;
        let titlePart = "";
        if (this.path != "") {
            if (sum > 1) {
                titlePart = `文件在 "${this.path}"`;
            } else {
                titlePart = `"${this.path}"`;
            }
        }
        titleEl.setText(
            `${this.discardCount == 0 ? "删除" : "丢弃"} ${titlePart}`
        );
        if (this.deleteCount > 0) {
            contentEl
                .createEl("p")
                .setText(
                    `您确定要删除 ${plural(this.deleteCount, "个未跟踪文件")} 吗？它们将根据您的 Obsidian 回收站设置被删除。`
                );
        }
        if (this.discardCount > 0) {
            contentEl
                .createEl("p")
                .setText(
                    `您确定要丢弃 ${plural(this.discardCount, "个跟踪文件")} 中的所有更改吗？`
                );
        }
        const div = contentEl.createDiv({ cls: "modal-button-container" });

        if (this.deleteCount > 0) {
            const discardAndDelete = div.createEl("button", {
                cls: "mod-warning",
                text: `${this.discardCount > 0 ? "丢弃" : "删除"}所有 ${plural(sum, "个文件")}`,
            });
            discardAndDelete.addEventListener("click", () => {
                if (this.resolve) this.resolve("delete");
                this.close();
            });
            discardAndDelete.addEventListener("keypress", () => {
                if (this.resolve) this.resolve("delete");
                this.close();
            });
        }

        if (this.discardCount > 0) {
            const discard = div.createEl("button", {
                cls: "mod-warning",
                text: `丢弃所有 ${plural(this.discardCount, "个跟踪文件")}`,
            });
            discard.addEventListener("click", () => {
                if (this.resolve) this.resolve("discard");
                this.close();
            });
            discard.addEventListener("keypress", () => {
                if (this.resolve) this.resolve("discard");
                this.close();
            });
        }

        const close = div.createEl("button", {
            text: "取消",
        });
        close.addEventListener("click", () => {
            if (this.resolve) this.resolve(false);
            return this.close();
        });
        close.addEventListener("keypress", () => {
            if (this.resolve) this.resolve(false);
            return this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
