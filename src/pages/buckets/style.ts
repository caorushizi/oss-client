import { createStyles } from "antd-style";

export default createStyles(({ css }) => ({
  container: css`
    height: 100vh;
    display: flex;
    flex-direction: column;
  `,
  actionBar: css`
    height: 40px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0 10px;
  `,
  toolBar: css`
    height: 40px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    padding: 0 10px;
  `,
  content: css`
    flex: 1;
    padding: 0 10px;
  `,
  footer: css`
    height: 40px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    padding: 0 10px;
  `,
}));
