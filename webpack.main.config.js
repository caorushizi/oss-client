const isDev = process.env.NODE_ENV === 'development';
console.log(__dirname);
module.exports = {
  entry: isDev ? './src/main/index.dev.ts' : './src/main/index.ts',
  module: {
    rules: require('./webpack.rules'),
  },
  node: {
    __dirname: true
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json']
  },
};
