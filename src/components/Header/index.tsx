import useStyle from "./style";

const Header = () => {
  const { styles } = useStyle();

  return <div className={styles.container}></div>;
};

export default Header;
