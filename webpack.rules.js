const isDev = process.env.NODE_ENV === "development";
const rules = [
  // Add support for native node modules
  {
    test: /\.node$/,
    use: "node-loader"
  },
  {
    test: /\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: "@marshallofsound/webpack-asset-relocator-loader",
      options: {
        outputAssetBase: "native_modules"
      }
    }
  },
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|.webpack)/,
    loaders: [
      {
        loader: "ts-loader",
        options: {
          transpileOnly: true
        }
      }
    ]
  }
];

if (isDev) {
  rules.push({
    test: /\.(js|ts|tsx)$/,
    enforce: "pre",
    loader: "eslint-loader",
    options: {
      emitWarning: true
    }
  });
}

module.exports = rules;
