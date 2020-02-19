import React, { useEffect, useState } from "react";
import "./index.scss";
import classNames from "classnames";
import shortId from "shortid";

type PropType = {
  className?: string;
  value: string;
  name: string;
  checked?: boolean;
};

const Radio = ({ className, value, name, checked }: PropType) => {
  const [id, setId] = useState<string>();
  const [curChecked, setCurChecked] = useState<boolean>(false);

  useEffect(() => {
    setId(shortId());
    setCurChecked(!!checked);
  }, []);

  return (
    <label htmlFor={id} className={classNames("oss-radio", className)}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={curChecked}
        onChange={() => {
          setCurChecked(!checked);
        }}
      />
      {value}
    </label>
  );
};

export default Radio;
