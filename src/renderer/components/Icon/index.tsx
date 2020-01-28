import React from "react";
import "./index.scss";
import { Item, Vdir } from "../../lib/vdir";

const Icon = ({ item }: { item: Vdir | Item }) => {
  return (
    <div id="icon">
      <svg className="icon-test" aria-hidden="true">
        {item instanceof Vdir ? <use xlinkHref="#icon-wenjian" /> : <use xlinkHref="#icon-sql" />}
      </svg>
    </div>
  );
};

export default Icon;
