const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const fs = require('fs')

// Determine the correct template path
const getTemplatePath = () => {
  const possiblePaths = [
    path.resolve(__dirname, 'public/index.html'),
    path.resolve(__dirname, '../frontend/public/index.html'),
    path.resolve(process.cwd(), 'frontend/public/index.html'),
    path.resolve(process.cwd(), 'public/index.html')
  ]

  for (const templatePath of possiblePaths) {
    if (fs.existsSync(templatePath)) {
      return templatePath
    }
  }

  // Fallback to the original path
  return path.resolve(__dirname, 'public/index.html')
}

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    publicPath: '/',
    clean: true,
  },
  stats: {
    children: true,
    errorDetails: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 30,
      maxAsyncRequests: 30,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
        ui: {
          test: /[\\/]node_modules[\\/](react-beautiful-dnd|sweetalert2|react-markdown)[\\/]/,
          name: 'ui-libs',
          chunks: 'all',
          priority: 15,
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    usedExports: true,
    sideEffects: false,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              jsx: 'react-jsx',
            },
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: getTemplatePath(),
      inject: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
    new webpack.DefinePlugin({
      'process.env': {
        REACT_APP_API_URL: JSON.stringify(process.env.REACT_APP_API_URL || 'http://localhost:4000/api'),
      },
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3000,
    historyApiFallback: true,
    // Fix for URI malformed error with CUID-based board IDs
    setupMiddlewares: (middlewares, devServer) => {
      // Add middleware to handle malformed URI errors
      devServer.app.use((req, res, next) => {
        try {
          // Try to decode the URL to catch malformed URIs early
          decodeURIComponent(req.url)
          next()
        } catch (error) {
          if (error instanceof URIError) {
            console.warn('Malformed URI detected, redirecting to dashboard:', req.url)
            res.redirect('/dashboard')
          } else {
            next(error)
          }
        }
      })
      return middlewares
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
}
