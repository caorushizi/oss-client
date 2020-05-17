import React, { useEffect, useState } from "react";
import { remote } from "electron";
import { Switch, Radio, Button, Input } from "antd";

import "./index.scss";
import { Platform } from "../../helper/enums";
import { getPlatform } from "../../helper/utils";
import {
  ConfigStore,
  FlowWindowStyle,
  initialConfig
} from "../../../main/types";

import {
  changeDirectDelete,
  changeDownloadDir,
  changeDownloadTip,
  changeFloatWindowShape,
  changeMarkdown,
  changeUploadOverride,
  changeUseHttps,
  getConfig
} from "../../helper/ipc";

const Setting = () => {
  const [config, setConfig] = useState<ConfigStore>(initialConfig);

  useEffect(() => {
    const initState = async () => {
      const c = await getConfig();
      setConfig(c);
    };
    initState().then(r => r);
  }, []);

  return (
    <div className="setting-wrapper">
      <section className="section">
        <div className="title">全局设置</div>
        <div className="settings">
          <div className="setting-item">
            <div className="setting-item-title">使用 https ：</div>
            <Switch
              className="setting-switch"
              checked={config.useHttps}
              onChange={(useHttps: boolean) => {
                changeUseHttps(useHttps);
                setConfig({ ...config, useHttps });
              }}
            />
          </div>
          <div className="setting-item">
            <div className="setting-item-title">删除时显示提示框：</div>
            <Switch
              className="setting-switch"
              checked={config.deleteShowDialog}
              onChange={(directDelete: boolean) => {
                changeDirectDelete(directDelete);
                setConfig({ ...config, deleteShowDialog: directDelete });
              }}
            />
          </div>
          <div className="setting-item">
            <div className="setting-item-title">
              如果文件已经存在是否覆盖文件：
            </div>
            <Switch
              className="setting-switch"
              checked={config.uploadOverwrite}
              onChange={(uploadOverride: boolean) => {
                changeUploadOverride(uploadOverride);
                setConfig({ ...config, uploadOverwrite: uploadOverride });
              }}
            />
          </div>
          <div className="setting-item">
            <div className="setting-item-title">
              <Button
                className="setting-button"
                onClick={() => {
                  remote.dialog
                    .showOpenDialog({
                      properties: [
                        "openDirectory",
                        "createDirectory",
                        "showHiddenFiles",
                        "promptToCreate"
                      ]
                    })
                    .then(({ canceled, filePaths }) => {
                      if (!canceled && filePaths.length > 0) {
                        const selectedPath = filePaths[0];
                        changeDownloadDir(selectedPath);
                        setConfig({ ...config, downloadDir: selectedPath });
                      }
                    });
                }}
              >
                选择下载位置
              </Button>
            </div>
            <Input
              className="setting-input"
              disabled
              placeholder="请选择默认下载位置"
              value={config.downloadDir}
            />
          </div>
        </div>
      </section>
      <section className="section">
        <p className="title">托盘设置</p>
        <div className="settings">
          <div className="setting-item">
            <div className="setting-item-title">传输完成后是否提示 ：</div>
            <Switch
              className="setting-switch"
              checked={config.transferDoneTip}
              onChange={(transferDoneTip: boolean) => {
                changeDownloadTip(transferDoneTip);
                setConfig({ ...config, transferDoneTip });
              }}
            />
          </div>
          <div className="setting-item">
            <div className="setting-item-title">复制url或者markdown格式：</div>
            <Switch
              className="setting-switch"
              checked={config.markdown}
              onChange={(markdown: boolean) => {
                changeMarkdown(markdown);
                setConfig({ ...config, markdown });
              }}
            />
          </div>
        </div>
      </section>
      {getPlatform() === Platform.windows && (
        <section className="section">
          <p className="title">悬浮窗设置</p>
          <div className="settings">
            <div className="setting-item">
              <div className="setting-item-title">是否显示悬浮窗 ：</div>
              <Switch
                className="setting-switch"
                checked={config.showFloatWindow}
                onChange={(showWindow: boolean) => {
                  setConfig({ ...config, showFloatWindow: showWindow });
                }}
              />
            </div>
            <div className="setting-item">
              <div className="setting-item-title">悬浮窗样式 ：</div>
              <Radio.Group
                className="setting-radio"
                name="FloatWindow"
                onChange={e => {
                  const style: FlowWindowStyle = Number(e.target.value);
                  changeFloatWindowShape(style);
                  setConfig({ ...config, floatWindowStyle: style });
                }}
              >
                <Radio className="input" value={FlowWindowStyle.circle} />
                <span className="inner">圆形</span>
                <Radio className="input" value={FlowWindowStyle.oval} />
                <span className="inner">椭圆形</span>
              </Radio.Group>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Setting;
