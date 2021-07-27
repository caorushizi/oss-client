import React, { FC } from "react";
import { useParams } from "react-router-dom";

const Bucket: FC = () => {
  const params = useParams();
  console.log(params, "params");
  return <div>bucket</div>;
};

export default Bucket;
