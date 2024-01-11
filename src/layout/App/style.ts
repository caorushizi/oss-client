import { createStyles } from "antd-style";
import backgroundImage from "../../assets/image/global.png";

export default createStyles(({ token, css }) => ({
  container: css`
    height: 100vh;
  `,
  sider: css`
    width: 225px;
    height: 100vh;
    overflow: auto;
  `,
  siderAppName: css`
    height: 30px;
    line-height: 30px;
    font-size: 15px;
    text-align: right;
    color: ${token.colorText};
    padding-right: 10px;
  `,
  contentInner: css`
    height: 100%;
    position: absolute;
    left: 225px;
    right: 0;
    background: url(${backgroundImage}) no-repeat;
  `,
  contentWrapper: css`
    height: 100vh;
    overflow: hidden;
  `,
}));
