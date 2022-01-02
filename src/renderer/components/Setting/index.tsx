import React, { useEffect, useState } from "react";
import { Button, Form, Input, message, Radio, Spin, Switch } from "antd";
import "./index.scss";
import { SelectOutlined } from "@ant-design/icons/lib";
import { Platform } from "../../helper/enums";
import { getPlatform } from "../../helper/utils";
import { changeSetting, getConfig } from "../../helper/ipc";
import { initialConfig } from "main/types";
import { remote } from "../../lib/electron";
import { ConfigStore } from "types/common";

enum FlowWindowStyle {
  circle,
  oval
}

const Setting = () => {
  const [config, setConfig] = useState<ConfigStore>(initialConfig);
  const [loading, setLoading] = useState<boolean>(false);
  const onSettingChange = async (key: string, value: any) => {
    try {
      setLoading(true);
      await changeSetting(key, value);
      setConfig({ ...config, [key]: value });
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };
  const radioOptions = [
    { label: "圆形", value: FlowWindowStyle.circle },
    { label: "椭圆形", value: FlowWindowStyle.oval }
  ];
  const onSelectDownloadPath = async () => {
    const dialogOptions: Electron.OpenDialogOptions = {
      properties: [
        "openDirectory",
        "createDirectory",
        "showHiddenFiles",
        "promptToCreate"
      ]
    };
    const { canceled, filePaths } = await remote.dialog.showOpenDialog(
      dialogOptions
    );
    if (canceled) return;
    if (filePaths.length <= 0) return;
    await onSettingChange("downloadDir", filePaths[0]);
  };
  const labelButton = () => (
    <Button size="small" onClick={onSelectDownloadPath}>
      选择下载位置
    </Button>
  );
  const inputAfter = () => (
    <SelectOutlined
      name="打开文件夹"
      onClick={() => {
        remote.shell.showItemInFolder(config.downloadDir);
      }}
    />
  );

  const initState = async () => {
    try {
      const config1 = await getConfig();
      setConfig(config1);
    } catch (e) {
      message.error(e.message);
    }
  };
  useEffect(() => {
    initState().then(r => r);
  }, []);

  return (
    <div className="setting-wrapper">
      <Spin spinning={loading} size="large">
        <section className="section">
          <div className="title">全局设置</div>
          <Form
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 12 }}
            labelAlign="left"
          >
            <Form.Item label="使用 https ">
              <Switch
                size="small"
                checked={config.useHttps}
                onChange={v => onSettingChange("useHttps", v)}
              />
            </Form.Item>
            <Form.Item label="删除时显示提示框">
              <Switch
                size="small"
                checked={config.deleteShowDialog}
                onChange={v => onSettingChange("deleteShowDialog", v)}
              />
            </Form.Item>
            <Form.Item label="如果文件已经存在是否覆盖文件">
              <Switch
                size="small"
                checked={config.uploadOverwrite}
                onChange={v => onSettingChange("uploadOverwrite", v)}
              />
            </Form.Item>
            <Form.Item colon={false} label={labelButton()}>
              <Input
                width={200}
                size="small"
                disabled
                placeholder="请选择默认下载位置"
                value={config.downloadDir}
                addonAfter={inputAfter()}
              />
            </Form.Item>
          </Form>
        </section>
        <section className="section">
          <p className="title">托盘设置</p>
          <Form
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 12 }}
            labelAlign="left"
            size="small"
          >
            <Form.Item label="传输完成后是否提示">
              <Switch
                size="small"
                checked={config.transferDoneTip}
                onChange={v => onSettingChange("transferDoneTip", v)}
              />
            </Form.Item>
            <Form.Item label="复制url或者markdown格式">
              <Switch
                size="small"
                checked={config.markdown}
                onChange={v => onSettingChange("markdown", v)}
              />
            </Form.Item>
          </Form>
        </section>
        {getPlatform() === Platform.windows && (
          <section className="section">
            <p className="title">悬浮窗设置</p>
            <Form
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 12 }}
              labelAlign="left"
              size="small"
            >
              <Form.Item label="是否显示悬浮窗">
                <Switch
                  size="small"
                  checked={config.showFloatWindow}
                  onChange={v => onSettingChange("showFloatWindow", v)}
                />
              </Form.Item>
              <Form.Item label="悬浮窗样式">
                <Radio.Group
                  options={radioOptions}
                  value={config.floatWindowStyle}
                  name="FloatWindow"
                  onChange={async v => {
                    await onSettingChange(
                      "floatWindowStyle",
                      Number(v.target.value)
                    );
                  }}
                />
              </Form.Item>
              <Form.Item label="上传时是否重命名">
                <Switch
                  size="small"
                  checked={config.uploadRename}
                  onChange={v => onSettingChange("uploadRename", v)}
                />
              </Form.Item>
            </Form>
          </section>
        )}
      </Spin>
    </div>
  );
};

export default Setting;
