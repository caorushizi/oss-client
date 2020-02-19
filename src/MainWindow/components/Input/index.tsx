import { IconProp } from "@fortawesome/fontawesome-svg-core";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./index.scss";

const Input = ({
  placeholder,
  icon
}: {
  placeholder?: string;
  icon?: IconProp;
}) => {
  return (
    <div className="oss-input--wrapper">
      {icon && <FontAwesomeIcon className="icon" icon={icon} />}
      <input
        className="oss-input"
        type="input"
        placeholder={placeholder || ""}
      />
    </div>
  );
};

export default Input;
