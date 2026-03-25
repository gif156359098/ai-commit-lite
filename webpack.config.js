const path = require('path');

module.exports = {
  target: 'node',
  mode: 'none',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.js'],
    mainFields: ['module', 'main']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      },
      {
        test: /\.json$/,
        exclude: /node_modules/,
        type: 'json'
      }
    ]
  },
  externals: {
    vscode: 'commonjs vscode'
  }
};