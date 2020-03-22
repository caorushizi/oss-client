import React, { useEffect, useState } from "react";
import "./index.scss";
import * as Yup from "yup";

import { Formik } from "formik";
import Input from "../BaseInput";
import { OssType } from "../../../main/types";
import { AppStore } from "../../../main/store/apps";
import Button from "../BaseButton";
import { getBuckets } from "../../helper/ipc";

type PropTypes = {
  activeOss: AppStore;
  onBucketUpdate: (store: AppStore) => void;
  onBucketDelete: (store: AppStore) => void;
};

const UpdateOssForm = ({
  activeOss,
  onBucketUpdate,
  onBucketDelete
}: PropTypes) => {
  const [buckets, setBuckets] = useState<string[]>([]);
  useEffect(() => {
    getBuckets().then(bucketList => {
      setBuckets(bucketList);
    });
  }, []);

  return (
    <Formik
      validationSchema={Yup.object({
        name: Yup.string()
          .trim()
          .required("名称必填"),
        ak: Yup.string()
          .trim()
          .required("ak 必填"),
        sk: Yup.string()
          .trim()
          .required("sk 必填"),
        type: Yup.number().min(-1, "type 必选"),
        uploadBucket: Yup.string()
          .trim()
          .required("默认上传 bucket 必选"),
        uploadPrefix: Yup.string()
          .trim()
          .notRequired()
      })}
      initialValues={activeOss}
      onSubmit={(values, { setSubmitting }) => {
        onBucketUpdate(values);
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
            <span className="oss-form_item__errors">
              {errors.name && touched.name && errors.name}
            </span>
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
            <span className="oss-form_item__errors">
              {errors.type && touched.type && errors.type}
            </span>
          </div>
          <div className="oss-form_item">
            <span className="oss-form_item__title">AK</span>
            <Input
              type="text"
              name="ak"
              className="oss-form_item__inner-input"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.ak}
              placeholder="请输入相应服务商 ak"
            />
            <span className="oss-form_item__errors">
              {errors.ak && touched.ak && errors.ak}
            </span>
          </div>
          <div className="oss-form_item">
            <span className="oss-form_item__title">SK</span>
            <Input
              type="password"
              name="sk"
              className="oss-form_item__inner-input"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.sk}
              placeholder="请输入相应服务商 sk"
            />
            <span className="oss-form_item__errors">
              {errors.sk && touched.sk && errors.sk}
            </span>
          </div>
          <div className="oss-form_item">
            <span className="oss-form_item__title">默认上传 bucket</span>
            <select
              className="oss-form_item__inner-select"
              name="uploadBucket"
              value={values.uploadBucket}
              id="bucket"
              onChange={handleChange}
            >
              {buckets.length > 0 &&
                buckets.map(i => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
            </select>
            <span className="oss-form_item__errors">
              {errors.uploadBucket &&
                touched.uploadBucket &&
                errors.uploadBucket}
            </span>
          </div>
          <div className="oss-form_item">
            <span className="oss-form_item__title">上传前缀</span>
            <Input
              type="text"
              name="uploadPrefix"
              className="oss-form_item__inner-input"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.uploadPrefix}
              placeholder="默认上传前缀"
            />
            <span className="oss-form_item__errors">
              {errors.uploadPrefix &&
                touched.uploadPrefix &&
                errors.uploadPrefix}
            </span>
          </div>
          <div className="oss-form_action">
            <Button type="submit" value="更新" disabled={isSubmitting} />
            <Button value="删除" onClick={() => onBucketDelete(values)} />
          </div>
        </form>
      )}
    </Formik>
  );
};
export default UpdateOssForm;
