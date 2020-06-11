const WebpackMultiPage = require('..')
const path = require('path')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')

const webpackMultiPage = new WebpackMultiPage({
    context: path.resolve(__dirname, 'src/pages')
})

module.exports = {
    mode: 'production',
    entry: webpackMultiPage.entry,
    plugins: [
        new CleanWebpackPlugin(),
        ...webpackMultiPage.createHtmlWebpackPlugins()
    ],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].js'
    },
    optimization: {
        runtimeChunk: 'single'
    }
}
