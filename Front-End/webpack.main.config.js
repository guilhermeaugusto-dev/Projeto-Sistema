const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    main: './src/main.js',
    preload: './src/preload.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: require('./webpack.rules'),
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'src', 'Views'), to: 'Views' },
        { from: path.resolve(__dirname, 'src', 'imagens'), to: 'imagens' },
        { from: path.resolve(__dirname, 'src', 'js'), to: 'js' },
        { from: path.resolve(__dirname, 'src', 'fontes'), to: 'fontes' },
      ],
    }),
  ],
  target: 'electron-main',
};