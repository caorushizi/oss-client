import React, { FC, useEffect } from "react";
import { OssType } from "../../../../../store/models/oss";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Select,
} from "@chakra-ui/react";
import useElectron from "hooks/useElectron";

interface Props {
  app: Oss;
}

const EditS3App: FC<Props> = ({ app }) => {
  const formik = useFormik<Oss>({
    initialValues: app,
    onSubmit: async (values, actions) => {
      const url = "https://rs.qbox.me/buckets";
      const token = await electron.getQiniuToken(app.ak, app.sk, url);

      const resp = await electron.request({
        url,
        headers: {
          Authorization: token,
        },
      });

      console.log("buckets: ", resp);
      actions.setSubmitting(false);
    },
    validationSchema: Yup.object({
      name: Yup.string().max(15, "").required(),
      type: Yup.string().oneOf(["0", "1", "2"]).required(),
      ak: Yup.string().required(),
      sk: Yup.string().required(),
    }),
  });
  const electron = useElectron();

  useEffect(() => {
    formik.setValues(app);
  }, [app]);

  return (
    <Box>
      <FormControl isInvalid={!!(formik.errors.name && formik.touched.name)}>
        <FormLabel width={"6em"} htmlFor="name">
          名称
        </FormLabel>
        <Input {...formik.getFieldProps("name")} id="name" placeholder="name" />
        <FormErrorMessage>{formik.errors.name}</FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!!(formik.errors.type && formik.touched.type)}>
        <FormLabel width={"6em"} htmlFor="type">
          类型
        </FormLabel>
        <Select
          {...formik.getFieldProps("type")}
          id="type"
          placeholder="Select option"
        >
          <option value={OssType.qiniu}>七牛云</option>
          <option value={OssType.ali}>阿里云</option>
          <option value={OssType.tencent}>腾讯云</option>
        </Select>
        <FormErrorMessage>{formik.errors.type}</FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!!(formik.errors.ak && formik.touched.ak)}>
        <FormLabel width={"6em"} htmlFor="ak">
          ak
        </FormLabel>
        <Input {...formik.getFieldProps("ak")} id="ak" placeholder="name" />
        <FormErrorMessage>{formik.errors.ak}</FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!!(formik.errors.sk && formik.touched.sk)}>
        <FormLabel width={"6em"} htmlFor="sk">
          sk
        </FormLabel>
        <Input
          {...formik.getFieldProps("sk")}
          type={"password"}
          id="sk"
          placeholder="name"
        />
        <FormErrorMessage>{formik.errors.sk}</FormErrorMessage>
      </FormControl>
      <FormControl
        isInvalid={!!(formik.errors.buckets && formik.touched.buckets)}
      >
        <FormLabel width={"6em"} htmlFor="buckets">
          buckets
        </FormLabel>
        <Input
          {...formik.getFieldProps("buckets")}
          id="buckets"
          placeholder="name"
        />
        <FormErrorMessage>{formik.errors.buckets}</FormErrorMessage>
      </FormControl>
      <FormControl
        isInvalid={!!(formik.errors.domains && formik.touched.domains)}
      >
        <FormLabel width={"6em"} htmlFor="domains">
          domains
        </FormLabel>
        <Input
          {...formik.getFieldProps("domains")}
          id="domains"
          placeholder="name"
        />
        <FormErrorMessage>{formik.errors.domains}</FormErrorMessage>
      </FormControl>
      <Button isLoading={formik.isSubmitting} onClick={formik.submitForm}>
        继续
      </Button>
    </Box>
  );
};

export default EditS3App;
