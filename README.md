# 云存储客户端

## 安装步骤

```shell script
git clone --depth 1 --single-branch https://github.com/caorushizi/oss-client.git
# 进入目录
cd oss-client
# 安装依赖
npx cross-env npm_config_electron_mirror="https://npm.taobao.org/mirrors/electron/" npm_config_electron_custom_dir="7.1.9" npm install
# 运行
npm start
```
## 页面展示

![页面展示](http://github.com/caorushizi/oss-client/raw/master/images/home-page.png)

## TODO List

### 文件展示页面

- 侧边栏：私有 bucket 显示 lock icon；
- 文件右键菜单：重命名、选择、全选；
- 文件夹右键菜单：重命名、选择、全选、删除；
- 文件选中：高亮并在 footer 显示选中数量；
- 文件夹选中：高亮并在 footer 显示文件夹内部文件的数量；
- 文件列表grid 模式：拖拽选择，响应键盘事件（ctrl、 shift、 esc）；
- toolbar：刷新 bucket；
- button group：下载（多项）、删除（多项）、新建文件夹、离线下载；
- footer：右边显示域名信息；
- 附加功能：虚拟列表；

### 传输列表页面
- 侧边栏：传输进度；
- 传输列表 header：正在下载数量的数量，「全部取消」按钮；
- 传输列表 列表：「打开文件位置」按钮、进度条
- 传输完成 header：「清空记录」按钮
- 传输完成 列表：「打开文件位置」按钮（仅下载）、「删除」按钮
- 缺省页

### 设置页面
- 全局设置：https、直接删除不显示提示框、如果文件已经存在是否覆盖文件、主题（炫彩模式、简洁模式）、默认下载位置（首次下载提示文件存储位置）、关闭时直接退出；
- 托盘设置：传输完成提示音、复制url或者markdown格式；
- 悬浮框设置（仅windows）：悬浮窗样式、是否显示悬浮窗；

### 托盘
- windows：显示主页面、设置、关闭程序；
- mac：显示主页面、设置、退出程序、最近传输列表（点击 item 复制链接）、清空最近记录、是否复制markdown链接、上传时显示上传进度 —— 参考ipic

### 添加 oss 
- 修改：默认域名、默认上传 bucket、默认前缀

### 悬浮窗（仅 Windows）

- 右键显示最近传输列表（点击 item 复制链接）、清空最近记录、是否复制markdown链接

## 技术栈
- electron
- electron-forge
- typescript
- react
