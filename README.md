# 云存储客户端

> 添加 VX `a84996057` BUG 秒修复

## 安装步骤

```shell script
git clone --depth 1 --single-branch https://github.com/caorushizi/oss-client.git
# 进入目录
cd oss-client
# 安装依赖
npx cross-env npm_config_electron_mirror="https://npm.taobao.org/mirrors/electron/" npm_config_electron_custom_dir="9.1.0" npm install
# 运行
npm start
# 打包
npx cross-env npm_config_electron_mirror="https://npm.taobao.org/mirrors/electron/" npm_config_electron_custom_dir="9.1.0" npm run make
```

## 页面展示

![首页](http://static.ziying.site/home-page-grid.png)

![首页](http://static.ziying.site/home-page-table.png)

![设置](http://static.ziying.site/setting.png)

# todo list

- selected 数组重置，进入文件夹
- grid 模式下点击取消选中、右键全选
- 上传完成后刷新、删除完成后刷新
- 缓存列表位置、缓存选中文件
- 默认储存痛、默认上传前缀、默认域名
- 样式：表单 input 出错时、下拉菜单、刷新后 grid 样式

## 下载链接

v0.0.1
---
[mac](http://static.ziying.site/oss-client-mac-v0.0.1.zip)

[windows](http://static.ziying.site/oss-client-windows-v0.0.1.exe)


## 技术栈

- electron
- electron-forge
- typescript
- react
