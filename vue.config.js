const CompressionWebpackPlugin = require('compression-webpack-plugin')
const registerRouter = require('./backend/router')
module.exports = {
  css: {
    loaderOptions: {
      sass: {
        // 全局引入变量和 mixin
        additionalData: `
          @import "@/assets/scss/variable.scss";
          @import "@/assets/scss/mixin.scss";
        `
      }
    }
  },
  devServer: {
    before(app) {
      registerRouter(app)
    }
  },
  configureWebpack: (config) => {
    if (process.env.NODE_ENV === 'production') {
      config.plugins.push(
        new CompressionWebpackPlugin({
          algorithm:'gzip',
          test: /\.js$|\.html$|\.json$|\.css/,
          threshold: 10240,
        })
      )
    }
    if (process.env.npm_config_report) {
      const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
      config.plugins.push(new BundleAnalyzerPlugin())
    }
    config.optimization.splitChunks = {
      maxInitialRequests: Infinity,
      minSize: 300 * 1024,
      chunks: 'all',
      cacheGroups: {
        antVendor: {
          test: /[\\/]node_modules[\\/]/,
          name (module) {
            // get the name.
            // node_modules/packageName/sub/path
            // or node_modules/packageName
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1]
            return `npm.${packageName.replace('@', '')}`
          }
        },
      }
    }
  },
  productionSourceMap: false,
  publicPath: process.env.NODE_ENV === 'production' ? '/music-next/' : '/'
}
