import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import classNames from "classnames";
import "./index.scss";

type PropTypes = {
  value?: string;
  className?: any;
  onClick?: () => void;
  disabled?: boolean;
  icon?: IconProp;
  type?: "button" | "submit";
};

const Button = ({
  value,
  className,
  onClick,
  icon,
  disabled = false,
  type = "button"
}: PropTypes) => {
  return (
    // eslint-disable-next-line react/button-has-type
    <button
      type={type}
      onClick={disabled ? f => f : onClick}
      className={classNames("oss-button", className, { disabled })}
    >
      {icon && (
        <FontAwesomeIcon icon={icon} className="oss-button__inner_icon" />
      )}
      <span className="oss-button__inner_text">{value || ""}</span>
    </button>
  );
};

export default Button;
