import { createStyles, css } from "antd-style";

export default createStyles({
  container: css`
    height: 100vh;

    @mixin main-wrapper-mixin {
      height: 100%;
      background-color: blue;
      position: absolute;
      left: 225px;
      right: 0;
    }

    .up,
    .down {
      height: 100%;
      background-color: blue;
    }
    .up-enter {
      @include main-wrapper-mixin;
      top: 100vh;
      opacity: 0;
    }

    .up-enter-active {
      @include main-wrapper-mixin;
      top: 0;
      opacity: 1;
      transition:
        top 0.16s,
        opacity 0.16s ease-in-out;
    }

    .up-exit {
      @include main-wrapper-mixin;
      top: 0;
      opacity: 1;
    }

    .up-exit-active {
      @include main-wrapper-mixin;
      top: -100vh;
      opacity: 0;
      transition:
        top 0.16s,
        opacity 0.16s ease-in-out;
    }

    .down-enter {
      @include main-wrapper-mixin;
      top: -100vh;
      opacity: 0;
    }

    .down-enter-active {
      @include main-wrapper-mixin;
      top: 0;
      opacity: 1;
      transition:
        top 0.16s,
        opacity 0.16s ease-in-out;
    }

    .down-exit {
      @include main-wrapper-mixin;
      top: 0;
      opacity: 1;
    }

    .down-exit-active {
      @include main-wrapper-mixin;
      top: 100vh;
      opacity: 0;
      transition:
        top 0.16s,
        opacity 0.16s ease-in-out;
    }
  `,
  sider: css`
    width: 225px;
  `,
});
