# 云存储客户端

## 安装步骤

```shell script
git clone --depth 1 --single-branch https://github.com/caorushizi/oss-client.git
# 进入目录
cd oss-client
# 安装依赖
npx cross-env npm_config_electron_mirror="https://mirrors.huaweicloud.com/electron/" npm_config_electron_custom_dir="9.3.1" npm install
# 运行
npm start
# 打包
npx cross-env npm_config_electron_mirror="https://mirrors.huaweicloud.com/electron/" npm_config_electron_custom_dir="9.3.1" npm run make
```

## 软件展示

![切换](http://static.ziying.site/switch.gif)

![模式切换](http://static.ziying.site/table.gif)

![拖拽上传](http://static.ziying.site/table.gif)

## 下载链接

v0.0.3
---
[oss-client-mac-v0.0.3](http://static.ziying.site/oss-client-mac-v0.0.3.zip)

[oss-client-windows-v0.0.3](http://static.ziying.site/oss-client-windows-v0.0.3.exe)


## 技术栈

- electron
- electron-forge
- typescript
- react
