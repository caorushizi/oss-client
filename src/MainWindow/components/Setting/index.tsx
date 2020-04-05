import React, { useState } from "react";
import Switch from "rc-switch";
import { remote } from "electron";
import { Radio, RadioGroup } from "react-radio-group";

import "./index.scss";
import Input from "../BaseInput";
import { Platform } from "../../helper/enums";
import { getPlatform } from "../../helper/utils";
import Button from "../BaseButton";
import { FlowWindowStyle, Theme } from "../../../main/types";
import { changeFloatWindowShape } from "../../helper/ipc";

const Setting = () => {
  const [downloadPath, setDownloadPath] = useState<string>("");
  const [theme, setTheme] = useState<Theme>(Theme.colorful);
  const [float, setFloat] = useState<FlowWindowStyle>(FlowWindowStyle.oval);

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
            <RadioGroup
              className="setting-radio"
              name="Theme"
              selectedValue={theme}
              onChange={value => {
                setTheme(value);
              }}
            >
              <Radio className="input" value={Theme.simple} />
              <span className="inner">简洁模式</span>
              <Radio className="input" value={Theme.colorful} />
              <span className="inner">炫彩模式</span>
            </RadioGroup>
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
              <RadioGroup
                className="setting-radio"
                name="FloatWindow"
                selectedValue={float}
                onChange={value => {
                  setFloat(value);
                  changeFloatWindowShape(value);
                }}
              >
                <Radio className="input" value={FlowWindowStyle.circle} />
                <span className="inner">圆形</span>
                <Radio className="input" value={FlowWindowStyle.oval} />
                <span className="inner">椭圆形</span>
              </RadioGroup>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Setting;
