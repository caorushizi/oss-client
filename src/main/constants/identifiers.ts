const SERVICE_IDENTIFIER = {
  ELECTRON_APP: Symbol.for("electron_app"),
  TASK_RUNNER: Symbol.for("task"),
  BOOTSTRAP: Symbol.for("bootstrap"),
  STORE: Symbol.for("store"),
  LOGGER: Symbol.for("logger"),
  CHANNELS: Symbol.for("channels"),
  OSS: Symbol.for("oss")
};

export default SERVICE_IDENTIFIER;
