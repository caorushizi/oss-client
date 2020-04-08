# 云存储客户端

## 安装步骤

```shell script
git clone --depth 1 --single-branch https://github.com/caorushizi/oss-client.git
# 进入目录
cd oss-client
# 安装依赖
npx cross-env npm_config_electron_mirror="https://npm.taobao.org/mirrors/electron/" npm_config_electron_custom_dir="8.2.0" npm install
# 运行
npm start
```

## 页面展示

![页面展示](https://github.com/caorushizi/oss-client/raw/master/images/home-page.png)

## TODO List

- 侧边栏：私有 bucket 显示 lock icon；
- 文件右键菜单：重命名、选择、全选；
- 文件夹右键菜单：重命名、选择、全选、删除；
- 文件选中：高亮并在 footer 显示选中数量；
- 文件夹选中：高亮并在 footer 显示文件夹内部文件的数量；
- 文件列表 grid 模式：拖拽选择，响应键盘事件（ctrl、 shift、 esc）；
- button group：下载（多项）、删除（多项）、新建文件夹、离线下载；
- 侧边栏：传输进度（饼图）；
- mac 托盘：最近传输列表（点击 item 复制链接）、清空最近记录、是否复制 markdown 链接、上传时显示上传进度 —— 参考 ipic；
- win 悬浮窗：右键显示最近传输列表（点击 item 复制链接）、清空最近记录、是否复制 markdown 链接 —— 同上；
- 修改 oss 配置：默认域名、默认上传 bucket、默认前缀；
- 窗悬浮框设置（仅 windows）：是否显示悬浮；
- 全局设置：切换主题；

## 技术栈

- electron
- electron-forge
- typescript
- react
