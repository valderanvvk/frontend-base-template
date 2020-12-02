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

// --- CONFIG SECTION ---
// все основные настройки собраны в этой части

// Порт запуска dev-server 
const PORT = 9000
// Директория с исходными файлами
const WORK_DIR = path.resolve(__dirname,'#src')
// Директория сборки проекта
const BUILD_DIR = path.resolve(__dirname,'dist')
// Оптимизация - разбиение на чанки
const SPLIT_CHUNKS = false
// Включение webpack's HotModuleReplacement (Обновление при изменении файлов)
// при проблемах обновления контента установить HOT_MODULE_REPLACEMENT = false
// так же можно (hot:false, liveReload:true, watchContentBase:true)
const HOT_MODULE_REPLACEMENT = true
// Открытие в новом окне браузера при запуске
const START_IN_NEW_WINDOW = true

// Структура проекта
const ps = {
  // базовый html шаблон
  htmlIndexFile: 'index.html',
  // точка входа 
  // https://webpack.js.org/concepts/entry-points/
  entry: {
    main: ['@babel/polyfill',`./index.js`],
  },
  // поддерживаемые расширения
  extensions: ['.js', '.jsx', '.ts', 'json'], 
  // базовая структура проекта
  src: {
    root: {
      // Директория root
      path: WORK_DIR, 
      // алиас для использования, при отсутвии поля "alias" - не создается
      alias:'@'
    },
    img: {path: './img/', alias:'@img'},
    public: {path: './public/', alias:'@public'},
    fonts: {path: './fonts/', alias:'@fonts'},
    html: {path: './html/', alias:'@html'}, 
    src: {path: './src/', alias:'@src'},
  }, 
  dist: {
    // корневой каталог для сбокри
    root: {path: BUILD_DIR},
    // js bundle
    // https://webpack.js.org/configuration/output/#outputfilename
    js: {
      // шаблон названия файлов в режиме разработки
      devMode:'[name]', 
      // шаблон названия файлов в режиме production-сборки
      prodMode:'[name].[hash]'
    },
    // css bundle
    css: {
      devMode:'[name]', 
      prodMode:'[name].[hash].min'
    }
  },
  // Копирование директорий в сборку
  copyDirectory: [
    { 
      from: "./public/", 
      to: "./public/", 
      noErrorOnMissing: true // при отсутвии файлов для копирования(пустая директория) - не выдавать ошибку 
    },
    { from: "./img/", to: "./img/", noErrorOnMissing: true },
    { from: "./fonts/", to: "./fonts/", noErrorOnMissing: true },
  ]
}

// --- /CONFIG SECTION ---

const filename = ext => isDev ? ps.dist[ext].devMode +`.${ext}` : ps.dist[ext].prodMode +`.${ext}`
// Проверка и сборка alias
const getAliases = ps => {  
  const result = {}
  for (let key in ps.src) {
    if (ps.src[key].hasOwnProperty('alias')) {
      if (ps.src[key]['alias'].length > 0) {
        result[`${ps.src[key].alias}`] = path.resolve(__dirname, WORK_DIR, ps.src[key].path) 
      }
    }
  }
  return result;
}

// Оптимизация при сборке
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
  entry: ps.entry,
  output: {
    filename: filename('js'), 
    path: ps.dist.root.path
  },
  resolve: {
    extensions: ps.extensions,
    alias: getAliases(ps)
  },
  optimization: optimization(),
  devtool: isDev ? 'inline-source-map' : false,
  devServer: {
    contentBase: WORK_DIR,
    open: START_IN_NEW_WINDOW,
    compress: true,
    port: PORT,
    hot: HOT_MODULE_REPLACEMENT,
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
          // { // Минимизация изображений 
          //   loader: 'image-webpack-loader',
          // }
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