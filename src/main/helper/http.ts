import axios from "axios";

const instance = axios.create();

instance.interceptors.response.use(
  ({ data }) => data,
  error => Promise.reject(error)
);

export default instance;
