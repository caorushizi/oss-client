import React, { useState } from "react";
import Switch from "rc-switch";
import "rc-switch/assets/index.css";
import { remote } from "electron";

import "./index.scss";
import Input from "../BaseInput";
import Radio from "../BaseRadio";
import { Platform } from "../../helper/enums";
import { getPlatform } from "../../helper/utils";
import Button from "../BaseButton";

const Setting = () => {
  const [downloadPath, setDownloadPath] = useState<string>("");
  const onDownloadSelect = () => {
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
          setDownloadPath(selectedPath);
        }
      });
  };

  return (
    <div className="setting-wrapper">
      <section className="section">
        <div className="title">全局设置</div>
        <div className="settings">
          <div className="setting-item">
            <div className="setting-item-title">使用 https ：</div>
            <Switch className="setting-switch" />
          </div>
          <div className="setting-item">
            <div className="setting-item-title">直接删除不显示提示框：</div>
            <Switch className="setting-switch" />
          </div>
          <div className="setting-item">
            <div className="setting-item-title">
              如果文件已经存在是否覆盖文件：
            </div>
            <Switch className="setting-switch" />
          </div>
          <div className="setting-item">
            <div className="setting-item-title">
              <Button
                className="setting-button"
                value="选择下载位置"
                onClick={onDownloadSelect}
              />
            </div>
            <Input
              className="setting-input"
              disabled
              placeholder="请选择默认下载位置"
              value={downloadPath}
            />
          </div>
          <div className="setting-item">
            <div className="setting-item-title">主题：</div>
            <Radio value="简洁模式" name="test" checked />
            <Radio value="炫彩模式" name="test" />
          </div>
        </div>
      </section>
      <section className="section">
        <p className="title">托盘设置</p>
        <div className="settings">
          <div className="setting-item">
            <div className="setting-item-title">传输完成后是否提示 ：</div>
            <Switch className="setting-switch" />
          </div>
          <div className="setting-item">
            <div className="setting-item-title">复制url或者markdown格式：</div>
            <Switch className="setting-switch" />
          </div>
        </div>
      </section>
      {getPlatform() === Platform.windows && (
        <section className="section">
          <p className="title">悬浮窗设置</p>
          <div className="settings">
            <div className="setting-item">
              <div className="setting-item-title">是否显示悬浮窗 ：</div>
              <Switch className="setting-switch" />
            </div>
            <div className="setting-item">
              <div className="setting-item-title">悬浮窗样式 ：</div>
              <Radio value="圆形" name="test1" checked />
              <Radio value="椭圆形" name="test1" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Setting;
