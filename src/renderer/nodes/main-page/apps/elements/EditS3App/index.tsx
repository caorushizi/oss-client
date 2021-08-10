import React, { FC } from "react";
import { Oss, OssType } from "../../../../../store/models/oss";
import { Field, Form, Formik } from "formik";
import { FieldProps } from "formik/dist/Field";
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

interface Props {
  app: Oss;
}

const EditS3App: FC<Props> = ({ app }) => {
  const electron = useElectron();

  // 验证姓名
  function validateName(value: string) {
    let error;
    if (value == null || value === "") error = "Name is required";
    return error;
  }

  return (
    <Formik<Oss>
      initialValues={app}
      onSubmit={async (values, actions) => {
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
      }}
    >
      {(props) => (
        <Form>
          <Field name="name" validate={validateName}>
            {({ field, form }: FieldProps) => (
              <FormControl
                isInvalid={!!(form.errors.name && form.touched.name)}
              >
                <HStack alignItems={"flex-start"}>
                  <Box width={"4em"}>
                    <FormLabel htmlFor="name">名称</FormLabel>
                  </Box>
                  <Box flex={1}>
                    <Input {...field} id="name" placeholder="name" />
                    <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                  </Box>
                </HStack>
              </FormControl>
            )}
          </Field>
          <Field name="type" validate={validateName}>
            {({ field, form }: FieldProps) => (
              <FormControl
                isInvalid={!!(form.errors.name && form.touched.name)}
              >
                <HStack alignItems={"flex-start"}>
                  <Box width={"4em"}>
                    <FormLabel htmlFor="type">类型</FormLabel>
                  </Box>
                  <Box flex={1}>
                    <Select {...field} id="type" placeholder="Select option">
                      <option value={OssType.qiniu}>七牛云</option>
                      <option value={OssType.ali}>阿里云</option>
                      <option value={OssType.tencent}>腾讯云</option>
                    </Select>
                    <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                  </Box>
                </HStack>
              </FormControl>
            )}
          </Field>
          <Field name="ak" validate={validateName}>
            {({ field, form }: FieldProps) => (
              <FormControl
                isInvalid={!!(form.errors.name && form.touched.name)}
              >
                <HStack>
                  <Box width={"4em"}>
                    <FormLabel htmlFor="ak">ak</FormLabel>
                  </Box>
                  <Box flex={1}>
                    <Input {...field} id="ak" placeholder="name" />
                    <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                  </Box>
                </HStack>
              </FormControl>
            )}
          </Field>
          <Field name="sk" validate={validateName}>
            {({ field, form }: FieldProps) => (
              <FormControl
                isInvalid={!!(form.errors.name && form.touched.name)}
              >
                <HStack>
                  <Box width={"4em"}>
                    <FormLabel htmlFor="sk">sk</FormLabel>
                  </Box>
                  <Box flex={1}>
                    <Input {...field} id="sk" placeholder="name" />
                    <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                  </Box>
                </HStack>
              </FormControl>
            )}
          </Field>
          <Field name="buckets" validate={validateName}>
            {({ field, form }: FieldProps) => (
              <FormControl
                isInvalid={!!(form.errors.name && form.touched.name)}
              >
                <HStack>
                  <Box width={"4em"}>
                    <FormLabel htmlFor="buckets">buckets</FormLabel>
                  </Box>
                  <Box flex={1}>
                    <Input {...field} id="buckets" placeholder="name" />
                    <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                  </Box>
                </HStack>
              </FormControl>
            )}
          </Field>
          <Field name="domains" validate={validateName}>
            {({ field, form }: FieldProps) => (
              <FormControl
                isInvalid={!!(form.errors.name && form.touched.name)}
              >
                <HStack>
                  <Box width={"4em"}>
                    <FormLabel htmlFor="domains">domains</FormLabel>
                  </Box>
                  <Box flex={1}>
                    <Input {...field} id="domains" placeholder="name" />
                    <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                  </Box>
                </HStack>
              </FormControl>
            )}
          </Field>
          <Button isLoading={props.isSubmitting} type="submit">
            继续
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default EditS3App;
