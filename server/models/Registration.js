const mongoose = require('mongoose')
const RegistrationSchema = require('./schemas/Registration')

const Registration = mongoose.model('registrations', RegistrationSchema)

module.exports = Registration
