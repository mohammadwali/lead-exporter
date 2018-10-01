const webpack = require('webpack'),
    path = require('path'),
    fileSystem = require('fs'),
    env = require('./scripts/env'),
    CleanWebpackPlugin = require('clean-webpack-plugin'),
    CopyWebpackPlugin = require('copy-webpack-plugin'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    WriteFilePlugin = require('write-file-webpack-plugin');

// load the secrets
const alias = {};

const secretsPath = path.join(__dirname, ('secrets.' + env.NODE_ENV + '.js'));

if (fileSystem.existsSync(secretsPath)) {
    alias['secrets'] = secretsPath;
}

const options = {
    entry: {
        options: path.join(__dirname, 'src/js/options.js'),
        popup: path.join(__dirname, 'src/js/popup/index.js'),
        inject: path.join(__dirname, 'src/js/inject/index.js'),
        background: path.join(__dirname, 'src/js/background/index.js'),
    },
    chromeExtensionBoilerplate: {
        notHotReload: ['inject']
    },
    output: {
        path: path.join(__dirname, 'build'),
        filename: '[name].bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader',
                exclude: /node_modules/
            },
            {
                test: new RegExp('\.(' + ['eot', 'otf', 'svg', 'ttf', 'woff', 'woff2', 'jpg', 'jpeg', 'png', 'gif'].join('|') + ')$'),
                loader: 'file-loader?name=[name].[ext]',
                exclude: /node_modules/
            },
            {
                test: new RegExp('\.(' + ['jpg', 'jpeg', 'png', 'gif'].join('|') + ')$'),
                loader: 'url-loader'
            },
            {
                test: /\.html$/,
                loader: 'html-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        alias: alias
    },
    plugins: [

        // clean the build folder
        new CleanWebpackPlugin(['build']),
        // expose and write the allowed env consts on the compiled bundle
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV)
        }),
        new CopyWebpackPlugin([{
            from: 'src/manifest.json',
            transform: function (content, path) {
                // generates the manifest file using the package.json informations
                return Buffer.from(JSON.stringify({
                    description: process.env.npm_package_description,
                    version: process.env.npm_package_version,
                    ...JSON.parse(content.toString())
                }))
            }
        }]),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'src', 'popup.html'),
            filename: 'popup.html',
            chunks: ['popup']
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'src', 'options.html'),
            filename: 'options.html',
            chunks: ['options']
        }),
        new WriteFilePlugin()
    ]
};

if (env.NODE_ENV === 'development') {
    options.devtool = 'cheap-module-eval-source-map';
}

module.exports = options;
