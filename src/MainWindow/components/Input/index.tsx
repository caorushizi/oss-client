import { IconProp } from "@fortawesome/fontawesome-svg-core";
import React, { ChangeEventHandler } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./index.scss";
import classNames from "classnames";

const Input = ({
  placeholder,
  icon,
  defaultValue,
  onChange,
  className,
  value
}: {
  placeholder?: string;
  icon?: IconProp;
  defaultValue?: string | number | string[];
  onChange?: ChangeEventHandler<HTMLInputElement>;
  className?: string;
  value?: number | string | string[];
}) => {
  return (
    <div className={classNames("oss-input--wrapper", className)}>
      {icon && <FontAwesomeIcon className="icon" icon={icon} />}
      <input
        className="oss-input"
        type="input"
        placeholder={placeholder || ""}
        defaultValue={defaultValue}
        onChange={onChange}
        value={value}
      />
    </div>
  );
};

export default Input;
