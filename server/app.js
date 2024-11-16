const express = require('express')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
// const cors = require('cors')
const path = require('path')
const compression = require('compression')
const passport = require('passport')
const expressSession = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(expressSession)
const locale = require('locale')
const { errorLogger, errorResponder } = require('./errors-handler')
const bodyParser = require('body-parser')
const Database = require('./db');
const { CONFIG } = require('./configs')

Database.getInstance();

const store = new MongoDBStore({
  uri: CONFIG.mongodb_host,
  collection: 'sessions',
  connectionOptions: {
    serverSelectionTimeoutMS: 10000,
  },
});

store.on('error', function (error) {
  console.log(error);
});

require('./security/passport')

const app = express()

app.use(logger('dev'))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: false, limit: '50mb' }))
app.use(cookieParser())
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false
      }
      return compression.filter(req, res)
    },
    level: 6,
    threshold: 10 * 1000,
  }),
)

// const corsWhitelist = []

// const corsOptions = {
//   origin: (origin, callback) => {
//     if (!origin) {
//       return callback(null, true)
//     }
//     for (const pattern of corsWhitelist) {
//       if (pattern.test(origin)) {
//         return callback(null, true)
//       }
//     }
//     callback(`${origin} Not allowed by CORS`)
//   },
//   credentials: true,
// }

// app.use(cors(corsOptions))

app.use(bodyParser.json())

const languages = ['cs', 'en', 'vi']
app.use(
  express.static(path.join(__dirname, 'public', 'admin'), { index: false }),
)

app.use(
  expressSession({
    secret: 'SomeR@aLLy$3crEt!@#',
    store: store,
    cookie: { maxAge: 1000 * 60 * 60 * 2 }, // 2 hours
    // if not set the cookies will not be saved in the browser after closing it
    resave: true, // Forces the session to be saved back to the session store,
    // even if the session was never modified during the request.
    saveUninitialized: true, // Forces a session that is "uninitialized" to be saved to the store.
    // A session is uninitialized when it is new but not modified.
  }),
)

app.use(passport.initialize())
app.use(passport.session())
app.use(locale(languages))

app.use('/', require('./routes/index'))

require('./routes/public')(app, '/public')
require('./routes/auth')(app, '/auth')
require('./routes/api')(app, '/api')
require('./routes/mod')(app, '/mod')

// error handler
app.use(errorLogger)
app.use(errorResponder)

// serve static files
app.get('*', async (req, res) => {
  return res.sendFile(
    path.resolve(__dirname, 'public', 'admin', 'index.html'),
  )
})
module.exports = app
