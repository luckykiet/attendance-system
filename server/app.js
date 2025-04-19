const express = require('express')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const path = require('path')
const compression = require('compression')
const passport = require('passport')
const expressSession = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(expressSession)
const locale = require('locale')
const cron = require('node-cron') // Import node-cron
const { errorLogger, errorResponder } = require('./errors-handler')
const bodyParser = require('body-parser')
const Database = require('./db')
const { generateDemoData } = require('./demo')
const { CONFIG } = require('./configs')
const { finalizeDailyAttendanceAggregation } = require('./utils')
const dayjs = require('dayjs')
const DailyAttendance = require('./models/DailyAttendance')
dayjs.extend(require('dayjs/plugin/customParseFormat'))

if (!CONFIG.isTest) {
  Database.getInstance()
}

let store

if (!CONFIG.isTest) {
  store = new MongoDBStore({
    uri: CONFIG.mongodb_host,
    collection: 'sessions',
    connectionOptions: {
      serverSelectionTimeoutMS: 10000,
    },
  })

  store.on('error', function (error) {
    console.log(error)
  })
}

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

app.use(bodyParser.json())

const languages = ['cs', 'en', 'vi']
app.use(
  express.static(path.join(__dirname, 'public'), { index: false }),
)

app.use(
  expressSession({
    secret: 'SomeR@aLLy$3crEt!@#',
    store: process.env.NODE_ENV !== 'test' ? store : undefined,
    cookie: { maxAge: 1000 * 60 * 60 * 2 }, // 2 hours
    resave: true,
    saveUninitialized: true,
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

// Run demo data generation
generateDemoData()

if (process.env.NODE_ENV !== 'test') {
  // Schedule cron job to rerun `generateDemoData` after 1 hour
  cron.schedule('0 * * * *', () => {
    console.log('Running hourly demo data generation...');
    generateDemoData();
  });

  cron.schedule('0 2 * * *', async () => {
    const dailyAttendances = await DailyAttendance.find({ confirmed: false });
    if (dailyAttendances.length > 0) {
      dailyAttendances.forEach(async (daily) => {
        const { date } = daily;
        console.log(`[CRON] Finalizing DailyAttendance for ${date}`);
        try {
          await finalizeDailyAttendanceAggregation(date);
          console.log('[CRON] Finalization successful');
        } catch (e) {
          console.error('[CRON] Finalization failed:', e.message);
        }
      })
    }
  });
}

// Error handler
app.use(errorLogger)
app.use(errorResponder)

// Serve static files
app.get('*public', async (req, res) => {
  return res.sendFile(
    path.resolve(__dirname, 'public', 'index.html'),
  )
})

module.exports = app
