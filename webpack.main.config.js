const isDev = process.env.NODE_ENV === "development";
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
  }
};
