import React, { useEffect, useState } from "react";
import "./index.scss";
import * as Yup from "yup";
import Select, { Option } from "rc-select";

import { ErrorMessage, Field, Form, Formik } from "formik";
import Input from "../BaseInput";
import { OssType, AppStore } from "../../../main/types";
import Button from "../BaseButton";
import { getBuckets, switchBucket } from "../../helper/ipc";

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
  const [domains, setDomains] = useState<string[]>([]);
  useEffect(() => {
    if (activeOss.defaultDomain) {
      switchBucket(activeOss.defaultDomain).then(obj => {
        setDomains(obj.domains);
      });
    }
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
        type: Yup.string().required("type必填"),
        uploadBucket: Yup.string()
          .trim()
          .required("默认上传 bucket 必选"),
        uploadPrefix: Yup.string()
          .trim()
          .notRequired(),
        defaultDomain: Yup.string()
          .trim()
          .notRequired()
      })}
      initialValues={activeOss}
      onSubmit={(values, { setSubmitting }) => {
        alert(JSON.stringify(values, null, 2));
        // onBucketUpdate(values);
        setSubmitting(false);
      }}
    >
      {({ isSubmitting }) => (
        <Form className="oss-form">
          <div className="oss-form_item">
            <span className="oss-form_item__title">名称</span>
            <Field
              component={Input}
              name="name"
              className="oss-form_item__inner-input"
              placeholder="请输入名称"
            />
            <ErrorMessage
              className="oss-form_item__errors"
              name="name"
              component="div"
            />
          </div>
          <div className="oss-form_item">
            <span className="oss-form_item__title">类型</span>
            <Field component={Select} name="type">
              <Option value={OssType.qiniu}>七牛云</Option>
            </Field>
            <ErrorMessage
              className="oss-form_item__errors"
              name="type"
              component="div"
            />
          </div>
          <div className="oss-form_item">
            <span className="oss-form_item__title">AK</span>
            <Field
              component={Input}
              name="ak"
              className="oss-form_item__inner-input"
              placeholder="请输入相应服务商 ak"
            />
            <ErrorMessage
              className="oss-form_item__errors"
              name="ak"
              component="div"
            />
          </div>
          <div className="oss-form_item">
            <span className="oss-form_item__title">SK</span>
            <Field
              component={Input}
              name="sk"
              className="oss-form_item__inner-input"
              placeholder="请输入相应服务商 sk"
            />
            <ErrorMessage
              className="oss-form_item__errors"
              name="sk"
              component="div"
            />
          </div>
          <div className="oss-form_item">
            <span className="oss-form_item__title">默认上传 bucket</span>
            <Field component={Select} name="uploadBucket">
              {buckets.length > 0 &&
                buckets.map(i => (
                  <Option key={i} value={i}>
                    {i}
                  </Option>
                ))}
            </Field>
            <ErrorMessage
              className="oss-form_item__errors"
              name="uploadBucket"
              component="div"
            />
          </div>
          <div className="oss-form_item">
            <span className="oss-form_item__title">上传前缀</span>
            <Field
              component={Input}
              name="uploadPrefix"
              className="oss-form_item__inner-input"
              placeholder="默认上传前缀"
            />
            <ErrorMessage
              className="oss-form_item__errors"
              name="uploadPrefix"
              component="div"
            />
          </div>
          <div className="oss-form_item">
            <span className="oss-form_item__title">默认域名</span>
            <Field component={Select} name="defaultDomain">
              {domains.length > 0 &&
                domains.map(i => (
                  <Option key={i} value={i}>
                    {i}
                  </Option>
                ))}
            </Field>
            <ErrorMessage
              className="oss-form_item__errors"
              name="type"
              component="div"
            />
          </div>
          <div className="oss-form_action">
            <Button type="submit" value="更新" disabled={isSubmitting} />
            <Button value="删除" onClick={() => {}} />
          </div>
        </Form>
      )}
    </Formik>
  );
};
export default UpdateOssForm;
