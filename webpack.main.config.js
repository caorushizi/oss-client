const isDev = process.env.NODE_ENV === "development";
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const rules = require("./webpack.rules");

module.exports = {
  entry: isDev ? "./src/main/index.dev.ts" : "./src/main/index.ts",
  module: {
    rules
  },
  node: {
    __dirname: true
  },
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"]
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, "static"),
        to: path.resolve(__dirname, ".webpack/main", "static")
      }
    ])
  ]
};
