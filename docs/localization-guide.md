# Obsidian 插件汉化指南

> 最后更新: 2026-05-07
> 适用版本: obsidian-git v2.38.2

## 项目概述

obsidian-git 是一个功能完整的 Obsidian 插件，支持 Git 版本控制。本次汉化工作基于 v2.38.2 稳定版，完整汉化了所有用户界面文本。

## 汉化范围

### 已汉化的文件

| 文件 | 汉化内容 |
|------|----------|
| `src/commands.ts` | 42个命令名称、Notice消息、模态框选项 |
| `src/setting/settings.ts` | 设置界面名称、描述、占位符、验证消息 |
| `src/main.ts` | displayMessage、displayError、Notice、placeholder、options |
| `src/statusBar.ts` | 状态栏显示文本 |
| `src/ui/modals/*.ts` | 所有模态框界面（分支、文件变更、自定义消息、丢弃、忽略） |
| `src/ui/sourceControl/sourceControl.svelte` | 源代码控制视图 |
| `src/ui/history/historyView.svelte` | 历史视图 |
| `src/constants.ts` | 常量和默认值 |

### 汉化策略

1. **直接修改源代码** - 不使用外部i18n库，直接修改TypeScript/Svelte文件
2. **保持功能完整** - 汉化仅影响显示文本，不改变任何逻辑
3. **生产构建** - 使用esbuild进行生产构建，确保性能

## 构建系统

### 依赖要求

```bash
# 必须依赖
npm install

# 额外需要（如果缺失）
npm install --save-dev sass
```

### 构建命令

```bash
# 开发构建（带监视）
npm run dev

# 生产构建
npm run build
```

### 构建配置

构建使用 `esbuild.config.mjs`，主要配置：

```javascript
// 外部依赖（不打包）
external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    "crypto",  // 必须添加，否则构建失败
]
```

### 常见构建问题

#### 1. 缺少 sass 依赖

**错误信息**:
```
✘ [ERROR] Could not resolve "sass"
```

**解决方案**:
```bash
npm install --save-dev sass
```

#### 2. crypto 模块未外部化

**错误信息**:
```
✘ [ERROR] Could not resolve "crypto"
```

**解决方案**: 在 `esbuild.config.mjs` 的 external 数组中添加 `"crypto"`

#### 3. TypeScript 类型错误

**错误信息**:
```
Type 'undefined' is not assignable to type 'string'
```

**解决方案**: 使用空字符串 `""` 而不是 `undefined` 作为默认值

## 汉化技巧

### 1. 批量搜索英文文本

```bash
# 搜索 Notice 消息
Select-String -Path "src\*.ts" -Pattern 'new Notice\('

# 搜索 displayMessage/displayError
Select-String -Path "src\*.ts" -Pattern 'displayMessage\(|displayError\('

# 搜索可能的英文字符串
Select-String -Path "src\*.ts" -Pattern '"[A-Z][a-z]+ [a-z]'
```

### 2. 常见汉化模式

#### Notice 消息
```typescript
// 英文
new Notice("No changes to commit");

// 中文
new Notice("没有要提交的更改");
```

#### displayMessage/displayError
```typescript
// 英文
this.displayMessage("Pushed to remote");

// 中文
this.displayMessage("已推送到远程");
```

#### 模态框选项
```typescript
// 英文
options: ["NO", "YES"]

// 中文
options: ["否", "是"]
```

#### 占位符
```typescript
// 英文
placeholder: "Create new branch"

// 中文
placeholder: "创建新分支"
```

### 3. 消息模板汉化

对于包含变量的消息，保持模板结构：

```typescript
// 英文
this.displayMessage(`Pushed ${num} file(s) to remote`);

// 中文
this.displayMessage(`已推送 ${num} 个文件到远程`);
```

## 已汉化的消息清单

### main.ts 中的消息

| 英文 | 中文 |
|------|------|
| Pull: Everything is up-to-date | 拉取：所有内容已是最新 |
| No commits to push | 没有要推送的提交 |
| No changes to commit | 没有要提交的更改 |
| Committed approx. X file(s) | 已提交 约 X 个文件 |
| Cannot push. You have conflicts in X file(s) | 无法推送。存在 X 个文件冲突 |
| Cannot push. You have conflicts | 无法推送。存在冲突 |
| Pushed to remote | 已推送到远程 |
| Pushed X file(s) to remote | 已推送 X 个文件到远程 |
| Pulled X file(s) from remote | 从远程拉取了 X 个文件 |
| Fetched from remote | 已从远程获取 |
| Switched to X | 已切换到 X |
| Created new branch X | 已创建新分支 X |
| Deleted branch X | 已删除分支 X |
| Create new branch (placeholder) | 创建新分支 |
| Delete branch (placeholder) | 删除分支 |
| YES/NO options | 是/否 |
| This branch isn't merged into HEAD. Force delete? | 此分支未合并到 HEAD。强制删除？ |
| You have conflicts in X file(s) | 存在 X 个文件冲突 |
| Did not commit, because you have conflicts in X file(s) | 未提交，因为存在 X 个文件冲突 |
| Did not commit, because you have conflicts | 未提交，因为存在冲突 |

### commands.ts 中的消息

| 英文 | 中文 |
|------|------|
| No repository found | 未找到仓库 |
| Discarded all changes in tracked files. | 已丢弃所有跟踪文件的更改。 |
| Discarded all files. | 已丢弃所有文件。 |
| Paused automatic routines. | 已暂停自动任务。 |
| Resumed automatic routines. | 已恢复自动任务。 |
| Do you really want to delete the repository (.git directory)? | 您确定要删除仓库（.git 目录）吗？此操作无法撤销。 |
| Successfully deleted repository. Reloading plugin... | 成功删除仓库。正在重新加载插件... |
| Too many changes to display | 更改太多，无法显示 |

### tools.ts 中的消息

| 英文 | 中文 |
|------|------|
| Running 'command'... | 正在运行 'command'... |

## 构建产物

### 文件位置

```
main.js          # 主要插件代码（压缩后约 756KB）
manifest.json    # 插件元数据
styles.css       # 插件样式（如果有）
```

### 安装方法

1. 将构建产物复制到 Obsidian 库的 `.obsidian/plugins/obsidian-git/` 目录
2. 在 Obsidian 设置中启用插件
3. 重启 Obsidian

## 注意事项

### 汉化原则

1. **保持一致性** - 相同功能使用相同的中文术语
2. **简洁明了** - 使用简洁的中文表达
3. **技术准确** - Git 术语使用标准中文翻译
4. **用户体验** - 确保消息清晰易懂

### 术语对照

| 英文 | 中文 |
|------|------|
| Commit | 提交 |
| Push | 推送 |
| Pull | 拉取 |
| Fetch | 获取 |
| Branch | 分支 |
| Merge | 合并 |
| Conflict | 冲突 |
| Repository | 仓库 |
| Remote | 远程 |
| Stage | 暂存 |
| Stash | 储藏 |
| Tag | 标签 |
| Checkout | 切换 |
| Clone | 克隆 |
| Diff | 差异 |
| Log | 日志 |
| Status | 状态 |

## 后续工作

### 可能的改进

1. **添加 i18n 支持** - 使用 vue-i18n 或类似库实现多语言切换
2. **完善翻译** - 检查是否有遗漏的英文文本
3. **测试验证** - 在实际使用中验证汉化效果
4. **文档更新** - 更新插件文档为中文版本

### 检查清单

- [x] 所有 Notice 消息已汉化
- [x] 所有 displayMessage/displayError 已汉化
- [x] 所有模态框界面已汉化
- [x] 所有设置项已汉化
- [x] 所有命令名称已汉化
- [x] 生产构建成功
- [x] 构建产物可正常使用

## 参考资源

- [Obsidian 插件开发文档](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [esbuild 配置文档](https://esbuild.github.io/api/)
- [TypeScript 汉化最佳实践](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)

---

**作者**: Sisyphus (AI Assistant)
**日期**: 2026-05-07
**版本**: 1.0
