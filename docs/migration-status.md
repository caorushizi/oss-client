# Migration status

## 第一阶段（已完成）

- 建立 One Workspace 目录与 pnpm workspace。
- 将桌面运行时从 Electron 迁移为 Tauri 2 薄壳。
- 将业务后端迁移为随机端口、会话鉴权的 Go HTTP sidecar。
- 升级到 React 19、Vite 8、TypeScript 7，并启用 React Compiler。
- 使用 Tailwind CSS 4 与本地 shadcn/ui 组件替代 Ant Design 和 Sass。
- 使用 SWR 与 Zustand 替代原状态层。
- 使用 oxlint、oxfmt 替代 ESLint、Prettier。
- 建立 OpenAPI 契约及 TypeScript 类型生成。
- 接入七牛云官方 Go SDK，支持 Profile、Bucket 和 Object 查询。

## 第二阶段（已完成）

- Profile、Region 和密钥直接持久化到本地 SQLite。
- 接入阿里云 OSS Go SDK V2，支持 Bucket 和 Object 分页查询。
- 接入腾讯云 COS Go SDK V5，支持 Bucket 和 Object 分页查询。
- Bucket 携带 Region，对象查询可覆盖 Profile 默认 Region。

## 第三阶段（已完成）

- 增加 Bucket、目录、Object 分页浏览和面包屑导航。
- 使用 Tauri dialog 选择上传文件和下载保存位置。
- 三家 Provider 均实现上传、下载与进度回调。
- 增加三并发传输队列、状态轮询、取消和失败展示。
- 下载使用临时文件与备份恢复策略，避免失败时破坏原文件。

## 第四阶段（已完成）

- 恢复旧版圆形和椭圆形悬浮窗，支持拖拽创建上传任务。
- 使用 AWS SDK for Go v2 接入 RustFS 和通用 S3 兼容存储。
- Profile 增加 Endpoint，并自动迁移现有 SQLite 数据库。
- RustFS 默认使用 `us-east-1`、SigV4 和 Path Style。

## 第五阶段（已完成）

- 恢复托盘、关闭到后台、托盘设置入口和悬浮窗显隐控制。
- Profile 支持编辑、保存默认 Bucket、上传前缀和默认域名，保存前校验云凭据。
- Profile SQLite 自动迁移到 v2；Profile 与传输历史统一持久化到 `oss-client.db`，并支持清空完成记录。
- 设置中的 HTTPS、上传覆盖、默认下载目录、完成提示、Markdown 地址和悬浮窗重命名已接入实际行为。
- 恢复网格框选、多选、列表排序、滚动分页、图片缩略图和七牛 Bucket 绑定域名。
- 支持文件夹拖拽上传，以及多文件和文件夹递归下载并保留目录结构。

## 下一阶段

1. 增加失败任务重试和可恢复断点记录。
2. 在获得明确的不可逆操作授权后，增加文件与目录递归删除。
3. 增加创建目录、重命名和云端复制等对象操作。
4. 增加系统原生通知，并为 Windows、macOS、Linux 建立签名和发布流水线。

阿里云与腾讯云在旧界面中没有启用，因此第一阶段删除旧 Electron 实现不会造成已启用功能回退。
