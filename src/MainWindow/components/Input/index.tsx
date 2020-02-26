import { IconProp } from "@fortawesome/fontawesome-svg-core";
import React, { ChangeEventHandler } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./index.scss";

const Input = ({
  placeholder,
  icon,
  defaultValue,
  onChange
}: {
  placeholder?: string;
  icon?: IconProp;
  defaultValue?: string | number | string[];
  onChange?: ChangeEventHandler<HTMLInputElement>;
}) => {
  return (
    <div className="oss-input--wrapper">
      {icon && <FontAwesomeIcon className="icon" icon={icon} />}
      <input
        className="oss-input"
        type="input"
        placeholder={placeholder || ""}
        defaultValue={defaultValue}
        onChange={onChange}
      />
    </div>
  );
};

export default Input;
