const mongoose = require('mongoose')
const RegisterSchema = require('./schema/Register')

const RegisterModel = mongoose.model('registers', RegisterSchema)

module.exports = RegisterModel
