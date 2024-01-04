import axios from "axios";

export async function getBuckets() {
  const resp = await axios.post("http://localhost:8080/api/getBuckets", {
    ak: "",
    sk: ""
  });

  return resp.data;
}
