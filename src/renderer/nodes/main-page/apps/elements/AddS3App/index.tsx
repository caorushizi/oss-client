import React, { FC, useRef } from "react";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
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
import * as localforage from "localforage";

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
            title: "保存成功",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          // 改变 store 中的状态
          dispatch(addOss(values));
          let apps = await localforage.getItem<Oss[] | undefined>("apps");
          apps ||= [];
          apps.push(values);
          await localforage.setItem("apps", apps);
          // 关闭弹窗
          onClose();
        } else {
          toast({
            title: "请输入正确的 ak 和 sk",
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
      <ModalContent bg={"#484B58"}>
        <ModalHeader color={"white"}>添加你的 app</ModalHeader>
        <ModalCloseButton color={"white"} />
        <ModalBody pb={6}>
          <FormControl
            isInvalid={!!(formik.errors.name && formik.touched.name)}
            isRequired
          >
            <FormLabel w={"6em"} color={"white"} fontSize={12} htmlFor="name">
              名称
            </FormLabel>
            <Input
              {...formik.getFieldProps("name")}
              id="name"
              placeholder="请输入云存储名称"
            />
            <FormErrorMessage>{formik.errors.name}</FormErrorMessage>
          </FormControl>
          <FormControl
            isInvalid={!!(formik.errors.type && formik.touched.type)}
            isRequired
          >
            <FormLabel w={"6em"} color={"white"} fontSize={12} htmlFor="type">
              类型
            </FormLabel>
            <Select
              {...formik.getFieldProps("type")}
              id="type"
              placeholder="请选择云存储类型"
              h={6}
              fontSize={12}
              color={"white"}
            >
              <option value={OssType.qiniu}>七牛云</option>
              <option value={OssType.ali}>阿里云</option>
              <option value={OssType.tencent}>腾讯云</option>
            </Select>
            <FormErrorMessage>{formik.errors.type}</FormErrorMessage>
          </FormControl>
          <FormControl
            isInvalid={!!(formik.errors.ak && formik.touched.ak)}
            isRequired
          >
            <FormLabel w={"6em"} color={"white"} fontSize={12} htmlFor="ak">
              ak
            </FormLabel>
            <Input
              {...formik.getFieldProps("ak")}
              h={6}
              fontSize={12}
              color={"white"}
              id="ak"
              placeholder="请输入云存储 ak"
            />
            <FormErrorMessage>{formik.errors.ak}</FormErrorMessage>
          </FormControl>
          <FormControl
            isInvalid={!!(formik.errors.sk && formik.touched.sk)}
            isRequired
          >
            <FormLabel w={"6em"} color={"white"} fontSize={12} htmlFor="sk">
              sk
            </FormLabel>
            <Input
              {...formik.getFieldProps("sk")}
              h={6}
              fontSize={12}
              color={"white"}
              id="sk"
              placeholder="请输入云存储 sk"
            />
            <FormErrorMessage>{formik.errors.sk}</FormErrorMessage>
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
