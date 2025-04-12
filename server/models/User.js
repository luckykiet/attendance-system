const mongoose = require('mongoose')
const UserSchema = require('./schemas/User')

const User = mongoose.model('users', UserSchema)

module.exports = User
