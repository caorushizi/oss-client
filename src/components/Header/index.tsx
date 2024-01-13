import { useRef } from "react";
import useStyle from "./style";

const Header = () => {
  const { styles } = useStyle();
  const headerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={styles.container}
      ref={headerRef}
      data-tauri-drag-region
    ></div>
  );
};

export default Header;
