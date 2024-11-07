const mongoose = require('mongoose')
const UserSchema = require('./schemas/User')

const UserModel = mongoose.model('users', UserSchema)

module.exports = UserModel
