> 版本编号： Version 2019.3.1

```shell script
npm install -g cross-env
cross-env npm_config_electron_mirror="https://npm.taobao.org/mirrors/electron/" npm_config_electron_custom_dir="7.1.10" npm install
```

```shell script
electron-rebuild -f -w sqlite3
```
