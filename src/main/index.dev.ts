const {
  default: installExtension,
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS
  // eslint-disable-next-line import/no-extraneous-dependencies
} = require("electron-devtools-installer");

// eslint-disable-next-line import/no-extraneous-dependencies
require("electron-debug")({ showDevTools: true });

// eslint-disable-next-line import/no-extraneous-dependencies
require("electron").app.on("ready", () => {
  Promise.all([
    installExtension(REACT_DEVELOPER_TOOLS),
    installExtension(REDUX_DEVTOOLS)
  ])
    .then(() => {
      console.log("all loaded ~");
    })
    .catch(e => {
      console.error("an error :", e);
      process.exit(1);
    });
});

require("./index");
