const path = require('path');
// Плагин для работы с HTML
const HTMLWebpackPlugin = require('html-webpack-plugin');
// Плагин для очистки директории
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
// Плагин для копирования файлов  { from: "source", to: "dest" }
const CopyPlugin = require("copy-webpack-plugin");
// Плагин минимизации CSS
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
// Плагин минимизация JS
const TerserPlugin = require("terser-webpack-plugin");

// Определение режимов запуска
const isDev = process.env.NODE_ENV === 'development'
const isProd = !isDev

// Порт запуска dev-server 
const PORT = 9000
// Директория с исходными файлами
const WORK_DIR = '#src'
// Директория сборки проекта
const BUILD_DIR = 'dist'
// Оптимизация - разбиение на чанки
const SPLIT_CHUNKS = false
// Структура проекта
const ps = {
  htmlIndexFile: 'index.html',
  jsIndexFile:'./index.js',
  src: {
    root: {path: path.resolve(__dirname,WORK_DIR), alias:'@'},
    img: {path: './img/', alias:'@img'},
    public: {path: './public/', alias:'@public'},
    fonts: {path: './fonts/', alias:'@fonts'},
    html: {path: './html/', alias:'@html'}, 
    src: {path: './src/', alias:'@src'},
  }, 
  dist: {
    root: {path: path.resolve(__dirname,BUILD_DIR)},
    js: {devMode:'[name]', prodMode:'[name].[hash]'},
    css: {devMode:'[name]', prodMode:'[name].[hash].min'}
  },
  copyDirectory: [
    { from: "./public/", to: "./public/" },
    { from: "./img/", to: "./img/" },
    { from: "./fonts/", to: "./fonts/" },
  ]
}

const filename = ext => isDev ? ps.dist[ext].devMode +`.${ext}` : ps.dist[ext].prodMode +`.${ext}`

const optimization = (param = SPLIT_CHUNKS) => {
  const splitChunks = param ? {chunks: 'all'} : {};  
  return {
    splitChunks: splitChunks,
    minimize: isProd, 
    minimizer: [
      new CssMinimizerPlugin(), 
      new TerserPlugin({
        extractComments: "all",
      }),
    ],
  }
}

// Настройка: Обработчик CSS
const cssLoader = () => {
  const loaders = [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {}
    }, 
    "css-loader"
  ]
  return loaders
}

// Натсройка: Обработчик Sass
const sassLoader = () => {
  const loaders = [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {}
    }, 
    'css-loader?url=false',
    {
      loader: 'resolve-url-loader',
      options: {
        sourceMap: true
      }
    },{
      loader: 'sass-loader',
      options: { sourceMap: true }
    },
  ]
  return loaders
}

// Настройка: оптимизация для babel-лоадеров JS - TS - JSX
const babelOptions = preset => {
  const opts = {
    presets: [
      '@babel/preset-env'
    ],
    plugins: [
      '@babel/plugin-proposal-class-properties'
    ]
  }
  
  if (preset) {
    opts.presets.push(preset)
  }

  return opts
}

module.exports = {
  // путь к рабочей директории проекта
  context: ps.src.root.path,
  mode: 'development',
  entry:
  {
    main: ['@babel/polyfill',ps.jsIndexFile],
  },
  output: {
    filename: filename('js'), 
    path: ps.dist.root.path
  },
  resolve: {
    extensions: ['.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, '#src'),
      '@public': path.resolve(__dirname, '#src/public'),
      '@img': path.resolve(__dirname, '#src/img'),
      '@src': path.resolve(__dirname, '#src/src'),
      '@fonts': path.resolve(__dirname, '#src/fonts'),
    }
  },
  optimization: optimization(),
  devtool: isDev ? 'inline-source-map' : false,
  devServer: {
    contentBase: path.resolve(__dirname, WORK_DIR),
    open: true,
    compress: true,
    port: PORT,
    hot: true
  },
  plugins: [
    new HTMLWebpackPlugin({
      template: ps.src.html.path + ps.htmlIndexFile,
      minify: {
        removeComments: isProd,
        collapseWhitespace: isProd 
      }
    }),
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: ps.copyDirectory
    }),
    new MiniCssExtractPlugin({
      filename: filename('css'),
      chunkFilename: '[id].css',
    }),
  
  ],
  module: {
    rules: [ 
      {
        test: /\.css$/i,
        use: cssLoader()
      },
      {
        test: /\.s[ac]ss$/i,
        use: sassLoader(),
      },
      {
        test: /\.(ttf|eot|woff|woff2|otf)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]?[hash]',
            }
          }
        ]
      },
      { 
        test: /\.(gif|png|jpe?g|svg|)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]',
            }
          },
          { // Минимизация изображений 
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
              },
              optipng: {
                enabled: false,
              },
              pngquant: {
                quality: [0.65, 0.90],
                speed: 4
              },
              gifsicle: {
                interlaced: false,
              },
              webp: {
                quality: 75
              }
            }
          }
        ]
      },
      { // JS - лоадер
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-class-properties']
          }
        }
      },
      { // TypeScript - лоадер
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: babelOptions('@babel/preset-typescript')
        }
      },
      { // REACT - лоадер
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: babelOptions('@babel/preset-react')
        }
      }
    ]
  }

}