import React from "react";
import classNames from "classnames";
import "./index.scss";

const OssButton = ({
  value,
  className,
  onClick,
  disabled = false
}: {
  value?: string;
  className?: any;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  return (
    <input
      type="button"
      value={value || ""}
      onClick={disabled ? f => f : onClick}
      className={classNames("oss-button", className, { disabled })}
    />
  );
};

export default OssButton;
