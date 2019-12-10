const path = require('path');
const webpack = require('webpack');
/** Webpack plugins */
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

/** Rules for ts files */
const tsLoaderRules = {
    test: /\.tsx?$/,
    use: 'ts-loader',
    exclude: /node_modules/
}
/** Rules for js files */
const jsLoaderRules = {
    test: /\.js$/,
    use: ["source-map-loader"],
    exclude: /(node_modules|bower_components)/,
    enforce: "pre"
}

/** Source maps mode */
const devtool = "cheap-module-eval-source-map";

const electronStarterJS = {
    entry: './src/electron-starter.ts',
    target: 'electron-main',
    devtool: devtool,
    module: {rules: [tsLoaderRules]},
    plugins: [
        /** Empty the dist folder */
        new CleanWebpackPlugin()
    ],
    /** Start dev web server, put here because when exporting multiple configurations
     * only the devServer options for the first configuration will be taken into
     * account and used for all the configurations in the array. */
    devServer: {
        contentBase: path.resolve(__dirname, 'dist'),
        index: 'index.html',    // Serve dist/index.html
        open: false,            // Don't open a web browser on server start
        host: 'localhost',      // Set host to localhost
        port: 8181,             // Run on port 8181
        /** Write electron-start to disk instead of serving it from memory */
        writeToDisk: (filePath) => {
            return /electron-starter/.test(filePath);
        }
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'electron-starter.js'
    }
}

const appJS = {
    entry: './src/app.ts',
    /** Add `.ts` and `.tsx` as a resolvable extension.
     * This will make import Name from "./Name"; work in typescript files
    */
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"]
    },
    devtool: devtool,
    module: {
        rules: [tsLoaderRules, jsLoaderRules]
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[contenthash].js'
    },
    plugins: [
        new webpack.DefinePlugin({
            'typeof CANVAS_RENDERER': JSON.stringify(true),
            'typeof WEBGL_RENDERER': JSON.stringify(true)
        }),
        /** General index.html with script tags automatically from template */
        new HtmlWebpackPlugin({
            title: 'ThreeJS GLSL',
            template: path.resolve(__dirname, 'src', 'index.html')
        })
    ],

    optimization: {
        /** Make sure contenthash stays identical when chunk content doesn't change */
        moduleIds: 'hashed',
        /** Extract webpack boilerplate code from app entry */
        runtimeChunk: 'single',
        /** Extract node_modules from app entry and bundle all them together */
        splitChunks: {
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    }
}

module.exports = [electronStarterJS, appJS]
