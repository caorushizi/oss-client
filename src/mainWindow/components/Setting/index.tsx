import React from "react";
import Switch from "rc-switch";
import "rc-switch/assets/index.css";
import Input from "../Input";
import Radio from "../Radio";
import "./index.scss";

const Setting = () => {
  return (
    <div className="setting-wrapper">
      <section className="section">
        <p className="title">全局设置</p>
        <div className="settings">
          <div className="setting-item">
            <div className="setting-item-title">使用 https ：</div>
            <Switch />
          </div>
          <div className="setting-item">
            <div className="setting-item-title">直接删除不显示提示框：</div>
            <Switch />
          </div>
          <div className="setting-item">
            <div className="setting-item-title">
              如果文件已经存在是否覆盖文件：
            </div>
            <Switch />
          </div>
          <div className="setting-item">
            <div className="setting-item-title">主题：</div>
            <div>
              <Radio value="简洁模式" name="test" checked />
              <Radio value="炫彩模式" name="test" />
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-item-title">默认下载位置：</div>
            <Input />
          </div>
          <div className="setting-item">
            <div className="setting-item-title">缓存位置：</div>
            <Input />
          </div>
          <div className="setting-item">
            <div className="setting-item-title">关闭页面直接退出程序：</div>
            <Switch />
          </div>
        </div>
      </section>
      <section className="section">
        <p className="title">托盘设置</p>
        <div className="settings">
          <div className="setting-item">
            <div className="setting-item-title">传输完成后是否闪烁 ：</div>
            <Switch />
          </div>
          <div className="setting-item">
            <div className="setting-item-title">复制url或者markdown格式：</div>
            <Switch />
          </div>
        </div>
      </section>
      <section className="section">
        <p className="title">悬浮窗设置</p>
        <div className="settings">
          <div className="setting-item">
            <div className="setting-item-title">悬浮窗样式 ：</div>
            <div>
              <Radio value="圆形" name="test1" checked />
              <Radio value="椭圆形" name="test1" checked />
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-item-title">默认上传位置：</div>
            <Input />
          </div>
          <div className="setting-item">
            <div className="setting-item-title">复制url或者markdown格式：</div>
            <Switch />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Setting;
