// Подключим normalize.css
import 'normalize.css'
// Подключим основные стили
import './sass/style.sass'

// Загрузка файла скриптов
import '@src/main.js'

import webpac_logo from '@public/webpack-logo.jpg'
document.querySelector('.maintext__logo-img').src = webpac_logo

import '@src/reactTest'
