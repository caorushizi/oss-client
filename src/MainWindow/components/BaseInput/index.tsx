import { IconProp } from "@fortawesome/fontawesome-svg-core";
import React, { ChangeEventHandler, FocusEventHandler } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./index.scss";
import classNames from "classnames";
import { InputType } from "zlib";

type PropTypes = {
  placeholder?: string;
  icon?: IconProp;
  defaultValue?: string | number | string[];
  onChange?: ChangeEventHandler<HTMLInputElement>;
  className?: string;
  value?: number | string | string[];
  onBlur?: FocusEventHandler<HTMLInputElement>;
  type?: string;
  name?: string;
};

const Input = ({
  placeholder,
  icon,
  defaultValue,
  onChange,
  className,
  value,
  onBlur,
  type = "input",
  name
}: PropTypes) => {
  return (
    <div className={classNames("oss-input--wrapper", className)}>
      {icon && <FontAwesomeIcon className="icon" icon={icon} />}
      <input
        className="oss-input"
        type={type}
        name={name}
        placeholder={placeholder || ""}
        defaultValue={defaultValue}
        onChange={onChange}
        value={value}
        onBlur={onBlur}
      />
    </div>
  );
};

export default Input;
