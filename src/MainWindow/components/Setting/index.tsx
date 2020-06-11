import React, { useEffect, useState } from "react";
import { remote } from "electron";
import { Switch, Radio, Button, Input, Form } from "antd";

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
  const radioOptions = [
    { label: "圆形", value: FlowWindowStyle.circle },
    { label: "椭圆形", value: FlowWindowStyle.oval }
  ];
  const onSelectDownloadPath = () => {
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
  };
  const labelButton = () => (
    <Button size="small" onClick={onSelectDownloadPath}>
      选择下载位置
    </Button>
  );

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
        <Form
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          labelAlign="left"
        >
          <Form.Item label="使用 https ">
            <Switch
              size="small"
              checked={config.useHttps}
              onChange={(useHttps: boolean) => {
                changeUseHttps(useHttps);
                setConfig({ ...config, useHttps });
              }}
            />
          </Form.Item>
          <Form.Item label="删除时显示提示框">
            <Switch
              size="small"
              checked={config.deleteShowDialog}
              onChange={(directDelete: boolean) => {
                changeDirectDelete(directDelete);
                setConfig({ ...config, deleteShowDialog: directDelete });
              }}
            />
          </Form.Item>
          <Form.Item label="如果文件已经存在是否覆盖文件">
            <Switch
              size="small"
              checked={config.uploadOverwrite}
              onChange={(uploadOverride: boolean) => {
                changeUploadOverride(uploadOverride);
                setConfig({ ...config, uploadOverwrite: uploadOverride });
              }}
            />
          </Form.Item>
          <Form.Item colon={false} label={labelButton()}>
            <Input
              width={200}
              size="small"
              disabled
              placeholder="请选择默认下载位置"
              value={config.downloadDir}
            />
          </Form.Item>
        </Form>
      </section>
      <section className="section">
        <p className="title">托盘设置</p>
        <Form
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          labelAlign="left"
          size="small"
        >
          <Form.Item label="传输完成后是否提示">
            <Switch
              size="small"
              checked={config.transferDoneTip}
              onChange={(transferDoneTip: boolean) => {
                changeDownloadTip(transferDoneTip);
                setConfig({ ...config, transferDoneTip });
              }}
            />
          </Form.Item>
          <Form.Item label="复制url或者markdown格式">
            <Switch
              size="small"
              checked={config.markdown}
              onChange={(markdown: boolean) => {
                changeMarkdown(markdown);
                setConfig({ ...config, markdown });
              }}
            />
          </Form.Item>
        </Form>
      </section>
      {getPlatform() === Platform.windows && (
        <section className="section">
          <p className="title">悬浮窗设置</p>
          <Form
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            labelAlign="left"
            size="small"
          >
            <Form.Item label="是否显示悬浮窗">
              <Switch
                size="small"
                checked={config.showFloatWindow}
                onChange={(showWindow: boolean) => {
                  setConfig({ ...config, showFloatWindow: showWindow });
                }}
              />
            </Form.Item>
            <Form.Item label="悬浮窗样式">
              <Radio.Group
                options={radioOptions}
                value={config.floatWindowStyle}
                name="FloatWindow"
                onChange={e => {
                  const style: FlowWindowStyle = Number(e.target.value);
                  changeFloatWindowShape(style);
                  setConfig({ ...config, floatWindowStyle: style });
                }}
              />
            </Form.Item>
          </Form>
        </section>
      )}
    </div>
  );
};

export default Setting;
