module.exports = {
  packagerConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        iconUrl: "http://soft.super-system.top/icon.ico",
        name: "setup",
        setupIcon: "build/icon.ico"
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"]
    },
    {
      name: "@electron-forge/maker-deb",
      config: {}
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {}
    }
  ],
  plugins: [
    [
      "@electron-forge/plugin-webpack",
      {
        mainConfig: "./webpack.main.config.js",
        renderer: {
          config: "./webpack.renderer.config.js",
          entryPoints: [
            {
              html: "./src/MainWindow/index.html",
              js: "./src/MainWindow/index.tsx",
              name: "main_window"
            },
            {
              html: "./src/FloatWindow/index.html",
              js: "./src/FloatWindow/index.tsx",
              name: "float_window"
            }
          ]
        }
      }
    ]
  ]
};
