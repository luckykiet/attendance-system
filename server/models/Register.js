const mongoose = require('mongoose')
const RegisterSchema = require('./schemas/Register')

const Register = mongoose.model('registers', RegisterSchema)

module.exports = Register
