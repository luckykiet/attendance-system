const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { loggers } = require('../utils');

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      username = username.toLowerCase();
      const decodedPassword = Buffer.from(password, 'base64').toString('utf8');

      const foundUser = await User.findOne({ username }).exec();

      if (!foundUser) {
        loggers.auth.info(`User not found`, { username });
        return done(null, false, { message: 'srv_invalid_credentials' });
      }

      if (!foundUser.isAvailable) {
        loggers.auth.info(`User blocked`, { username });
        return done(null, false, { message: 'srv_user_not_available' });
      }

      const isMatch = bcrypt.compare(decodedPassword, foundUser.password);

      if (!isMatch) {
        return done(null, false, { message: 'srv_invalid_credentials' });
      }

      return done(null, {
        id: foundUser._id,
        username: foundUser.username,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
        retailId: foundUser.retailId,
      });
    } catch (error) {
      loggers.auth.error(`Error during login: ${error.message}`);
      return done(null, false, { message: 'srv_failed_to_authorize' });
    }
  })
);

passport.serializeUser((user, done) => {
  console.log('Passport serializeUser');
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log('Passport deserializeUser');
  const user = await User.findOne({ _id: id }).exec();
  if (!user) {
    return done(null, false);
  }
  done(null, user);
});
