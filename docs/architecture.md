# Architecture

本仓库遵循 One Workspace Convention：

- `apps/desktop`：React + Tauri 2 桌面应用。
- `services/oss-sidecar`：Go 本地 HTTP 后端。
- `packages/contracts`：OpenAPI 通信契约。

## 进程边界

Tauri 只负责桌面生命周期、托盘与悬浮窗、用户选择的本地路径和 Go sidecar 生命周期。Go sidecar 仅监听随机分配的 `127.0.0.1` 端口，并为每次启动生成独立会话令牌。React 通过 Tauri 官方 HTTP 插件访问 Go API。

## 数据边界

- SWR 管理来自 Go API 的远端数据。
- Zustand 管理纯客户端交互状态。
- Go 管理云厂商 SDK、传输任务和 Profile 元数据。
- Profile 与永久凭据由 Go 直接持久化到 SQLite。
- 永久凭据不得返回给前端或写入日志。

## 本地通信

```text
React 19
  │  HTTP + bearer token
  ▼
Tauri HTTP plugin
  │  仅允许 127.0.0.1
  ▼
Go sidecar（随机端口）
  │
  ├─ Profile 与持久化传输历史
  └─ 云厂商 SDK / AWS SDK for Go v2（RustFS、S3）
```

云存储业务接口不经过 Tauri command 桥接，统一由 OpenAPI 描述的本地 HTTP API 提供。Tauri command 仅用于读取本次 sidecar 会话、控制窗口和托盘，以及在用户授权的本地目录内展开上传路径或准备下载子目录。

## 文件传输

React 通过 Tauri 官方 dialog 插件获得用户明确选择的上传源路径或下载目标路径，再通过已鉴权的本地 HTTP API 创建传输任务。Go 同时运行最多三个任务，并由 SWR 轮询任务状态。

- 上传由各云厂商 SDK 处理，并将进度统一映射为字节数；RustFS/S3 使用 Path Style 和自动分片传输。
- 下载先写入目标目录中的随机临时文件，成功后再替换最终文件。
- 覆盖已有下载文件时会先原子重命名为临时备份；替换失败会尝试恢复。
- 传输状态写入用户应用数据目录的 `oss-client.db`，重启后保留历史；上次未完成的任务会标记为已取消。
- sidecar 退出时会取消所有等待中和进行中的任务。

## Go 目录约定

Go 服务采用 `golang-standards/project-layout` 的适用部分：可执行入口放在 `cmd/`，不可被外部项目导入的实现放在 `internal/`。当前服务规模不需要提前创建空的 `pkg/`、`api/` 或 `web/` 目录。

## Profile 持久化

Profile 元数据、Access Key、Secret 和传输历史统一保存在用户应用数据目录的 `oss-client.db`。数据库使用 WAL；两个存储模块分别限制连接数量并使用事务约束。文件权限在支持 POSIX 权限的平台收紧为 `0600`。HTTP 响应只返回 Access Key 尾部提示，不返回完整 Access Key 或 Secret。
