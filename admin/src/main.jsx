import '@/assets/scss/index.scss'
import 'dayjs/locale/cs'
import 'simplebar-react/dist/simplebar.min.css'
import 'react-virtualized/styles.css'

import App from '@/App'
import React from 'react'
import ReactDOM from 'react-dom/client'
import dayjs from 'dayjs'

dayjs.locale('cs')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
