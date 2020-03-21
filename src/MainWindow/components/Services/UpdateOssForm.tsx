import React from "react";
import "./index.scss";
import { Formik } from "formik";
import Input from "../BaseInput";
import { OssType } from "../../../main/types";
import { AppStore } from "../../../main/store/apps";
import Button from "../BaseButton";

type PropTypes = {
  activeOss: AppStore;
  onBucketUpdate: () => void;
  onBucketDelete: () => void;
};

const UpdateOssForm = ({
  activeOss,
  onBucketUpdate,
  onBucketDelete
}: PropTypes) => {
  return (
    <Formik
      initialValues={activeOss}
      validate={values => {
        const errors: any = {};
        if (!values.name) {
          errors.name = "Required";
        } else if (
          !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.name)
        ) {
          errors.name = "Invalid email address";
        }
        return errors;
      }}
      onSubmit={(values, { setSubmitting }) => {
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2));
          // onBucketAdd(form.name, form.ak, form.sk, form.type);
          setSubmitting(false);
        }, 400);
      }}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        isSubmitting
        /* and other goodies */
      }) => (
        <form onSubmit={handleSubmit} className="oss-form">
          <div className="oss-form_item">
            <span className="oss-form_item__title">名称</span>
            <Input
              type="email"
              name="name"
              className="oss-form_item__inner-input"
              placeholder="请输入名称"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.name && touched.name && errors.name}
          </div>
          <div className="oss-form_item">
            <span className="oss-form_item__title">类型</span>
            <select
              className="oss-form_item__inner-select"
              name="bucket"
              id="bucket"
              onChange={handleChange}
            >
              <option value={OssType.qiniu}>七牛云</option>
              <option value={OssType.ali}>阿里云</option>
              <option value={OssType.tencent}>腾讯云</option>
            </select>
          </div>
          <div className="oss-form_item">
            <span className="oss-form_item__title">ak</span>
            <Input
              type="password"
              name="password"
              className="oss-form_item__inner-input"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.ak}
              placeholder="请输入相应服务商 ak"
            />
            {errors.ak && touched.ak && errors.ak}
          </div>
          <div className="oss-form_item">
            <span className="oss-form_item__title">sk</span>
            <Input
              type="password"
              name="password"
              className="oss-form_item__inner-input"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.ak}
              placeholder="请输入相应服务商 sk"
            />
            {errors.ak && touched.ak && errors.ak}
          </div>
          <div className="oss-form_item">
            <span className="oss-form_item__title">bucket</span>
            <select
              className="oss-form_item__inner-select"
              name="bucket"
              id="bucket"
              onChange={handleChange}
            >
              <option value={OssType.qiniu}>七牛云</option>
              <option value={OssType.ali}>阿里云</option>
              <option value={OssType.tencent}>腾讯云</option>
            </select>
          </div>
          <div className="oss-form_item">
            <span className="oss-form_item__title">类型</span>
            <select
              className="oss-form_item__inner-select"
              name="bucket"
              id="bucket"
              onChange={handleChange}
            >
              <option value={OssType.qiniu}>七牛云</option>
              <option value={OssType.ali}>阿里云</option>
              <option value={OssType.tencent}>腾讯云</option>
            </select>
          </div>
          <div>
            <Button type="submit" value="更新" onClick={onBucketUpdate} />
            <Button value="删除" onClick={onBucketDelete} />
          </div>
        </form>
      )}
    </Formik>
  );
};
export default UpdateOssForm;
