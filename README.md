# OSS Client

一个以 Tauri 薄壳、Go sidecar 和 React 为核心的跨平台云存储客户端。

## 当前技术栈

- 桌面壳：Tauri 2
- 前端：React 19、React Compiler、Vite 8、TypeScript 7
- UI：Tailwind CSS 4、本地 shadcn/ui 组件
- 数据：SWR（服务端状态）+ Zustand（界面状态）
- 本地后端：Go HTTP sidecar
- 云存储：七牛云、阿里云 OSS、腾讯云 COS、RustFS 与通用 S3 兼容存储
- 工具：oxlint、oxfmt、taze、pnpm workspace

## 已实现功能

- 七牛云、阿里云 OSS、腾讯云 COS、RustFS/S3 Profile 持久化
- Bucket、目录和 Object 分页浏览
- 多文件上传和单文件下载
- 最多三个并发传输任务、实时进度和取消
- 下载使用同目录临时文件，完成后再替换目标文件

七牛云下载需要 Bucket 已绑定可用的 HTTPS 访问域名。

RustFS 使用 S3 API Endpoint（默认端口 `9000`）、Region（默认 `us-east-1`）和 Path Style。通用 S3 兼容存储使用相同配置方式。

## 环境要求

- Node.js 24+
- pnpm 11+
- Go 1.25+
- Rust stable 与 Tauri 对应的系统依赖

## 开发

```powershell
pnpm install
pnpm dev
```

只运行浏览器前端：

```powershell
pnpm dev:web
```

检查全部代码：

```powershell
pnpm check
pnpm lint
```

## 构建

```powershell
pnpm build
```

构建流程会先生成与当前 Rust target 匹配的 Go sidecar，再交给 Tauri 打包。

## 目录

```text
apps/desktop                 React + Tauri 桌面应用
packages/contracts           OpenAPI 契约与生成的 TypeScript 类型
services/oss-sidecar         Go 本地 HTTP 服务
  cmd/oss-sidecar            程序入口
  internal/app               生命周期与启动协议
  internal/httpapi           HTTP 路由和中间件
  internal/profiles          Profile 领域逻辑
  internal/storage           云厂商抽象及实现
docs                         架构与迁移文档
scripts                      工作区构建脚本
```

详细设计见 [架构说明](./docs/architecture.md) 和 [迁移状态](./docs/migration-status.md)。

## 安全模型

Go sidecar 只监听随机分配的 `127.0.0.1` 端口，每次启动生成独立 bearer token，并通过标准输出只向 Tauri 父进程发送一次启动信息。Profile 与密钥直接保存在用户应用数据目录的 SQLite 数据库中；密钥不会从 API 返回给 React，也不会写入日志。
