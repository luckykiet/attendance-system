const mongoose = require('mongoose')
const RegistrationSchema = require('./schemas/Registration')

const RegistrationModel = mongoose.model('registrations', RegistrationSchema)

module.exports = RegistrationModel
