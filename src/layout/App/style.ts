import { createStyles } from "antd-style";

export default createStyles(({ token, css }) => ({
  container: css`
    height: 100vh;

    .up,
    .down {
    }
    .up-enter {
      top: 100vh;
      opacity: 0;
    }

    .up-enter-active {
      top: 0;
      opacity: 1;
      transition:
        top 0.16s,
        opacity 0.16s ease-in-out;
    }

    .up-exit {
      top: 0;
      opacity: 1;
    }

    .up-exit-active {
      top: -100vh;
      opacity: 0;
      transition:
        top 0.16s,
        opacity 0.16s ease-in-out;
    }

    .down-enter {
      top: -100vh;
      opacity: 0;
    }

    .down-enter-active {
      top: 0;
      opacity: 1;
      transition:
        top 0.16s,
        opacity 0.16s ease-in-out;
    }

    .down-exit {
      top: 0;
      opacity: 1;
    }

    .down-exit-active {
      top: 100vh;
      opacity: 0;
      transition:
        top 0.16s,
        opacity 0.16s ease-in-out;
    }
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
  `,
  contentWrapper: css`
    height: 100vh;
    overflow: hidden;
  `,
}));
