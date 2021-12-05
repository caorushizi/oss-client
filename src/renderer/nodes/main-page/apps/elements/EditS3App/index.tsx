import React, { FC, useEffect, useState } from "react";
import { OssType } from "../../../../../store/models/oss";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Select,
} from "@chakra-ui/react";
import useElectron from "hooks/useElectron";

export enum FormEnum {
  view,
  edit,
}

interface Props {
  app: Oss;
}

const EditS3App: FC<Props> = ({ app }) => {
  const [mode, setMode] = useState(FormEnum.view);
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

  const editForm = () => {
    setMode(FormEnum.edit);
  };

  useEffect(() => {
    formik.setValues(app);
  }, [app]);

  return (
    <Box>
      <FormControl isInvalid={!!(formik.errors.name && formik.touched.name)}>
        <HStack>
          <Box width={"6em"} color={"white"}>
            <FormLabel htmlFor="name" fontSize={14}>
              名称
            </FormLabel>
          </Box>
          <Box flex={1}>
            {mode === FormEnum.view ? (
              formik.getFieldProps("name").value ?? "-"
            ) : (
              <>
                <Input
                  {...formik.getFieldProps("name")}
                  id="name"
                  placeholder="请输入名称"
                />
                <FormErrorMessage>{formik.errors.name}</FormErrorMessage>
              </>
            )}
          </Box>
        </HStack>
      </FormControl>
      <FormControl isInvalid={!!(formik.errors.type && formik.touched.type)}>
        <HStack>
          <Box width={"6em"} color={"white"}>
            <FormLabel htmlFor="type" fontSize={14}>
              类型
            </FormLabel>
          </Box>
          <Box flex={1}>
            {mode === FormEnum.view ? (
              formik.getFieldProps("type").value ?? "-"
            ) : (
              <>
                <Select
                  {...formik.getFieldProps("type")}
                  id="type"
                  placeholder="请选择云存储类型"
                >
                  <option value={OssType.qiniu}>七牛云</option>
                  <option value={OssType.ali}>阿里云</option>
                  <option value={OssType.tencent}>腾讯云</option>
                </Select>
                <FormErrorMessage>{formik.errors.type}</FormErrorMessage>
              </>
            )}
          </Box>
        </HStack>
      </FormControl>
      <FormControl isInvalid={!!(formik.errors.ak && formik.touched.ak)}>
        <HStack>
          <Box width={"6em"} color={"white"}>
            <FormLabel htmlFor="ak" fontSize={14}>
              ak
            </FormLabel>
          </Box>
          <Box flex={1}>
            {mode === FormEnum.view ? (
              formik.getFieldProps("ak").value ?? "-"
            ) : (
              <>
                <Input
                  {...formik.getFieldProps("ak")}
                  id="ak"
                  placeholder="请输入 ak"
                />
                <FormErrorMessage>{formik.errors.ak}</FormErrorMessage>
              </>
            )}
          </Box>
        </HStack>
      </FormControl>
      <FormControl isInvalid={!!(formik.errors.sk && formik.touched.sk)}>
        <HStack>
          <Box width={"6em"} color={"white"}>
            <FormLabel htmlFor="sk" fontSize={14}>
              sk
            </FormLabel>
          </Box>
          <Box flex={1}>
            {mode === FormEnum.view ? (
              formik.getFieldProps("sk").value ?? "-"
            ) : (
              <>
                <Input
                  {...formik.getFieldProps("sk")}
                  type={"password"}
                  id="sk"
                  placeholder="请输入 sk"
                />
                <FormErrorMessage>{formik.errors.sk}</FormErrorMessage>
              </>
            )}
          </Box>
        </HStack>
      </FormControl>
      <FormControl
        isInvalid={!!(formik.errors.buckets && formik.touched.buckets)}
      >
        <HStack>
          <Box width={"6em"} color={"white"}>
            <FormLabel htmlFor="buckets" fontSize={14}>
              buckets
            </FormLabel>
          </Box>
          <Box flex={1}>
            {mode === FormEnum.view ? (
              formik.getFieldProps("buckets").value ?? "-"
            ) : (
              <>
                <Input
                  {...formik.getFieldProps("buckets")}
                  id="buckets"
                  placeholder="请选择默认储存桶"
                />
                <FormErrorMessage>{formik.errors.buckets}</FormErrorMessage>
              </>
            )}
          </Box>
        </HStack>
      </FormControl>
      <FormControl
        isInvalid={!!(formik.errors.domains && formik.touched.domains)}
      >
        <HStack>
          <Box width={"6em"} color={"white"}>
            <FormLabel htmlFor="domains" fontSize={14}>
              domains
            </FormLabel>
          </Box>
          <Box flex={1}>
            {mode === FormEnum.view ? (
              formik.getFieldProps("domains").value ?? "-"
            ) : (
              <>
                <Input
                  {...formik.getFieldProps("domains")}
                  id="domains"
                  placeholder="请选择默认域名"
                />
                <FormErrorMessage>{formik.errors.domains}</FormErrorMessage>
              </>
            )}
          </Box>
        </HStack>
      </FormControl>
      <HStack>
        {mode === FormEnum.edit ? (
          <>
            <Button isLoading={formik.isSubmitting} onClick={formik.submitForm}>
              重置
            </Button>
            <Button isLoading={formik.isSubmitting} onClick={formik.submitForm}>
              保存
            </Button>
          </>
        ) : (
          <>
            <Button onClick={editForm}>编辑</Button>
            <Button isLoading={formik.isSubmitting} onClick={formik.submitForm}>
              删除
            </Button>
          </>
        )}
      </HStack>
    </Box>
  );
};

export default EditS3App;
