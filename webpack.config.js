//@ts-check

'use strict';

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'node', // VSCode extensions run in a Node.js-context
  mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

  entry: './src/extension.ts', // the entry point of this extension
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded
  },
  resolve: {
    extensions: ['.ts', '.js']
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
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../mcp-server/dist'),
          to: path.resolve(__dirname, 'dist/mcp-server'),
          noErrorOnMissing: false
        },
        {
          from: path.resolve(__dirname, '../mcp-server/node_modules'),
          to: path.resolve(__dirname, 'dist/mcp-server/node_modules'),
          noErrorOnMissing: false
        },
        {
          from: path.resolve(__dirname, '../mcp-server/package.json'),
          to: path.resolve(__dirname, 'dist/mcp-server/package.json'),
          noErrorOnMissing: false
        },
        {
          from: path.resolve(__dirname, '../mcp-server/start-with-restart.js'),
          to: path.resolve(__dirname, 'dist/mcp-server/start-with-restart.js'),
          noErrorOnMissing: false
        },
        {
          from: path.resolve(__dirname, '../mcp-server/wrapper-with-restart.js'),
          to: path.resolve(__dirname, 'dist/mcp-server/wrapper-with-restart.js'),
          noErrorOnMissing: false
        },
        {
          from: path.resolve(__dirname, 'Auxly-icon.png'),
          to: path.resolve(__dirname, 'dist/Auxly-icon.png'),
          noErrorOnMissing: false
        },
        {
          from: path.resolve(__dirname, 'Auxly-Icon-Large.png'),
          to: path.resolve(__dirname, 'dist/Auxly-Icon-Large.png'),
          noErrorOnMissing: false
        }
      ]
    })
  ],
  optimization: {
    minimize: false, // Disable minification to preserve exports
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
};

module.exports = [ extensionConfig ];


