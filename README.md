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

## 技术栈

- electron
- electron-forge
- typescript
- react
