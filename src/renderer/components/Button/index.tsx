import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import classNames from "classnames";
import "./index.scss";

const Button = ({
  value,
  className,
  onClick,
  icon,
  disabled = false
}: {
  value?: string;
  className?: any;
  onClick?: () => void;
  disabled?: boolean;
  icon?: IconProp;
}) => {
  return (
    <button
      type="button"
      onClick={disabled ? f => f : onClick}
      className={classNames("oss-button", className, { disabled })}
    >
      {icon && <FontAwesomeIcon className="icon" icon={icon} />}
      <span>{value || ""}</span>
    </button>
  );
};

export default Button;
