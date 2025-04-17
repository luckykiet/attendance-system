const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { getLogger } = require('../utils');
const authLogger = getLogger('auth');

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      username = username.toLowerCase();
      const decodedPassword = Buffer.from(password, 'base64').toString('utf8');
      authLogger.info(`1`, { username });
      const foundUser = await User.findOne({ username }).exec();
      authLogger.info(`2`, { username });
      if (!foundUser) {
        authLogger.info(`User not found`, { username });
        return done(null, false, { message: 'srv_invalid_credentials' });
      }
      authLogger.info(`3`, { username });
      if (!foundUser.isAvailable) {
        authLogger.info(`User blocked`, { username });
        return done(null, false, { message: 'srv_user_not_available' });
      }
      authLogger.info(`4`, { username });
      const isMatch = await bcrypt.compare(decodedPassword, foundUser.password);

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
      authLogger.error(`Error during login: ${error.message}`);
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
