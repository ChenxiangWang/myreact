const HtmlWebpackPlugin = require('html-webpack-plugin');
const {template} = require("@babel/core");

const path = require('path');

module.exports = {
    entry: {
        main: './src/index.js'
    },
    devServer: {
        port: 3000,
        host: 'localhost',
        open: true,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: ['@babel/plugin-transform-react-jsx']
                    }
                }
            }
        ]
    },
    mode: "development",
    optimization: {
        minimize: false
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: "react",
            template: path.resolve(__dirname, "public/index.html"),
        }),
    ],
}