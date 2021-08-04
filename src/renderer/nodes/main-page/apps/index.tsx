import React, { FC } from "react";
import MainSection from "../elements/MainSection";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  List,
  ListIcon,
  ListItem,
} from "@chakra-ui/react";
import { MdCheckCircle } from "react-icons/all";
import { Field, Form, Formik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { AppState as ReduxState } from "../../../store/reducers";
import { AppState } from "../../../store/reducers/app.reducer";
import { addApp } from "../../../store/actions/app.actions";
import { App, AppType } from "../../../store/models/app";
import shortId from "shortid";

// app 的列表
const Apps: FC = () => {
  const dispatch = useDispatch();
  const app = useSelector<ReduxState, AppState>((state) => state.app);
  const activeApp = app.apps.find((i) => i.name === app.active);

  // 验证姓名
  function validateName(value: string) {
    let error;
    if (!value) {
      error = "Name is required";
    } else if (value.toLowerCase() !== "naruto") {
      error = "Jeez! You're not a fan 😱";
    }
    return error;
  }

  // 点击添加按钮
  const handleAddApp = () => {
    dispatch(
      addApp({
        type: AppType.ali,
        name: shortId(),
        ak: "123123",
        sk: "123123",
      })
    );
  };

  return (
    <MainSection>
      <Flex>
        <Box w={56} px={3}>
          <Button
            h={6}
            bg={"whiteAlpha.300"}
            borderRadius={8}
            borderColor={"white"}
            borderWidth={1}
            color={"white"}
            fontFamily={"Alibaba-PuHuiTi-Light"}
            fontWeight={600}
            fontSize={12}
            _hover={{ bg: "whiteAlpha.400" }}
            _focus={{
              boxShadow:
                "0 0 1px 1px rgba(255, 255, 255, .75), 0 1px 1px rgba(0, 0, 0, .15)",
            }}
            onClick={handleAddApp}
          >
            添加
          </Button>
          <List spacing={2} mt={4}>
            {app.apps.map((app) => (
              <ListItem
                cursor={"pointer"}
                px={3}
                borderRadius={10}
                fontSize={12}
                color={
                  location.pathname.startsWith("/main/bucket")
                    ? "white"
                    : "whiteAlpha.700"
                }
                bg={
                  location.pathname.startsWith("/main/bucket")
                    ? "rgba(0, 0, 0, 0.15)"
                    : ""
                }
                _hover={{
                  color: "white",
                  bg: location.pathname.startsWith("/main/bucket")
                    ? "rgba(0, 0, 0, 0.15)"
                    : "rgba(0, 0, 0, 0.05)",
                }}
              >
                <Box d={"flex"} alignItems={"center"} h={6}>
                  <ListIcon as={MdCheckCircle} color="green.500" />
                  {app.name}
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
        <Box>
          <Heading>编辑</Heading>
          {activeApp && (
            <Formik<App>
              initialValues={activeApp}
              onSubmit={(values, actions) => {
                setTimeout(() => {
                  alert(JSON.stringify(values, null, 2));
                  actions.setSubmitting(false);
                }, 1000);
              }}
            >
              {(props) => (
                <Form>
                  <Field name="name" validate={validateName}>
                    {({ field, form }) => (
                      <FormControl
                        isInvalid={form.errors.name && form.touched.name}
                      >
                        <FormLabel htmlFor="name">First name</FormLabel>
                        <Input {...field} id="name" placeholder="name" />
                        <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                  <Field name="ak" validate={validateName}>
                    {({ field, form }) => (
                      <FormControl
                        isInvalid={form.errors.name && form.touched.name}
                      >
                        <FormLabel htmlFor="name">First name</FormLabel>
                        <Input {...field} id="name" placeholder="name" />
                        <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                  <Field name="sk" validate={validateName}>
                    {({ field, form }) => (
                      <FormControl
                        isInvalid={form.errors.name && form.touched.name}
                      >
                        <FormLabel htmlFor="name">First name</FormLabel>
                        <Input {...field} id="name" placeholder="name" />
                        <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                  <Button
                    mt={4}
                    colorScheme="teal"
                    isLoading={props.isSubmitting}
                    type="submit"
                  >
                    Submit
                  </Button>
                </Form>
              )}
            </Formik>
          )}
        </Box>
      </Flex>
    </MainSection>
  );
};

export default Apps;
