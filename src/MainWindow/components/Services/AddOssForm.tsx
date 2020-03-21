import React from "react";
import { Formik } from "formik";
import * as Yup from "yup";

import "./index.scss";
import Input from "../BaseInput";
import { OssType } from "../../../main/types";
import Button from "../BaseButton";

type PropTypes = {
  onBucketAdd: (name: string, ak: string, sk: string, type: number) => void;
};

const AddOssForm = ({ onBucketAdd }: PropTypes) => {
  return (
    <Formik
      initialValues={{
        name: `默认名称${Date.now()}`,
        ak: "",
        sk: "",
        type: OssType.qiniu
      }}
      validationSchema={Yup.object({
        name: Yup.string()
          .trim()
          .required("名称不能为空"),
        ak: Yup.string()
          .trim()
          .required("sk 不能为空"),
        sk: Yup.string()
          .trim()
          .required("sk 不能为空"),
        type: Yup.number().min(-1, "类型必须选择")
      })}
      onSubmit={(values, { setSubmitting }) => {
        onBucketAdd(values.name, values.ak, values.sk, values.type);
        setSubmitting(false);
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
              type="text"
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
              name="type"
              value={values.type}
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
              type="text"
              name="ak"
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
              name="sk"
              className="oss-form_item__inner-input"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.sk}
              placeholder="请输入相应服务商 sk"
            />
            {errors.sk && touched.sk && errors.sk}
          </div>
          <Button type="submit" disabled={isSubmitting} value="添加" />
        </form>
      )}
    </Formik>
  );
};
export default AddOssForm;
