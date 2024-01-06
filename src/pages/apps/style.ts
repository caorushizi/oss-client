import { createStyles } from "antd-style";

export default createStyles(({ css }) => ({
  container: css``,
  appItem: css`
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    padding: 5px 10px;
    margin: 5px;
    cursor: pointer;
    &:hover {
      background-color: rgba(0, 0, 0, 0.2);
    }
  `,
}));
