import React, { FC, useRef } from "react";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  useToast,
} from "@chakra-ui/react";
import { Oss, OssType } from "../../../../../store/models/oss";
import * as Yup from "yup";
import { useFormik } from "formik";
import shortid from "shortid";
import useElectron from "hooks/useElectron";
import { useDispatch } from "react-redux";
import { addOss } from "../../../../../store/actions/oss.actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AddS3App: FC<Props> = ({ isOpen, onClose }) => {
  const initialRef = useRef(null);
  const electron = useElectron();
  const toast = useToast();
  const dispatch = useDispatch();
  const formik = useFormik<Oss>({
    initialValues: {
      name: shortid(),
      ak: "",
      sk: "",
      type: OssType.qiniu,
    },
    onSubmit: async (values, actions) => {
      try {
        const url = "https://rs.qbox.me/buckets";
        const token = await electron.getQiniuToken(values.ak, values.sk, url);

        const resp = await electron.request<string[]>({
          url,
          headers: { Authorization: token },
        });

        if (resp.statusCode === 200) {
          toast({
            title: "Account created.",
            description: "We've created your account for you.",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          // 改变 store 中的状态
          dispatch(addOss(values));
          // 关闭弹窗
          onClose();
        } else {
          toast({
            title: "Account created.",
            description: "We've created your account for you.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }

        console.log("buckets: ", resp);
      } finally {
        actions.setSubmitting(false);
      }
    },
    validationSchema: Yup.object({
      name: Yup.string().max(15, "").required(),
      type: Yup.string().oneOf(["0", "1", "2"]).required(),
      ak: Yup.string().required(),
      sk: Yup.string().required(),
    }),
  });

  return (
    <Modal
      closeOnOverlayClick={false}
      initialFocusRef={initialRef}
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent bg={"purple.500"}>
        <ModalHeader>添加你的 app</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl
            isInvalid={!!(formik.errors.name && formik.touched.name)}
          >
            <HStack alignItems={"flex-start"}>
              <Box width={"6em"}>
                <FormLabel htmlFor="name">名称</FormLabel>
              </Box>
              <Box flex={1}>
                <Input
                  {...formik.getFieldProps("name")}
                  id="name"
                  placeholder="name"
                />
                <FormErrorMessage>{formik.errors.name}</FormErrorMessage>
              </Box>
            </HStack>
          </FormControl>
          <FormControl
            isInvalid={!!(formik.errors.type && formik.touched.type)}
          >
            <HStack alignItems={"flex-start"}>
              <Box width={"6em"}>
                <FormLabel htmlFor="type">类型</FormLabel>
              </Box>
              <Box flex={1}>
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
              </Box>
            </HStack>
          </FormControl>
          <FormControl isInvalid={!!(formik.errors.ak && formik.touched.ak)}>
            <HStack>
              <Box width={"6em"}>
                <FormLabel htmlFor="ak">ak</FormLabel>
              </Box>
              <Box flex={1}>
                <Input
                  {...formik.getFieldProps("ak")}
                  id="ak"
                  placeholder="name"
                />
                <FormErrorMessage>{formik.errors.ak}</FormErrorMessage>
              </Box>
            </HStack>
          </FormControl>
          <FormControl isInvalid={!!(formik.errors.sk && formik.touched.sk)}>
            <HStack>
              <Box width={"6em"}>
                <FormLabel htmlFor="sk">sk</FormLabel>
              </Box>
              <Box flex={1}>
                <Input
                  {...formik.getFieldProps("sk")}
                  id="sk"
                  placeholder="name"
                />
                <FormErrorMessage>{formik.errors.sk}</FormErrorMessage>
              </Box>
            </HStack>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose} mr={3}>
            取消
          </Button>
          <Button
            isLoading={formik.isSubmitting}
            onClick={() => formik.handleSubmit()}
          >
            保存
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddS3App;
