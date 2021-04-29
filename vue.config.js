
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  configureWebpack: {
    node: {
      __dirname: true
    },
    target: 'electron-renderer',
    plugins: [
      new CopyPlugin([
        { from: './public/logo.png' }
      ])
    ]
  },

  publicPath: '/public',

  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        extraResources: [
          './public/logo.png'
        ],
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          createStartMenuShortcut: true
        },
        win: {
          icon: './public/logo.png'
        }
      }
    }
  }
}
