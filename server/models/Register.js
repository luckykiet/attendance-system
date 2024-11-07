const mongoose = require('mongoose')
const RegisterSchema = require('./schemas/Register')

const RegisterModel = mongoose.model('registers', RegisterSchema)

module.exports = RegisterModel
