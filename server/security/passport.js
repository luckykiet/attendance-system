const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const User = require('../model/User')

const bcrypt = require('bcryptjs')

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      username = username.toLowerCase()
      const foundUser = await User.findOne({ username }).exec();

      if (!foundUser) {
        return done(null, false, {
          message: 'srv_invalid_credentials',
        })
      }

      const isMatch = await bcrypt.compare(password, foundUser.password)

      if (!isMatch) {
        return done(null, false, {
          message: 'srv_invalid_credentials',
        })
      }

      return done(null, foundUser)
    } catch (error) {
      console.error(error)
      return done(null, false, {
        message: 'srv_failed_to_authorize',
      })
    }
  })
)

passport.serializeUser((user, done) => {
  console.log('Passport serializeUser')
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  console.log('Passport deserializeUser')
  const user = await User.findOne({ _id: id }).exec();
  if (!user) {
    return done(null, false)
  }
  done(null, user)
})
