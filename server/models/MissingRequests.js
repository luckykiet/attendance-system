const mongoose = require('mongoose')
const MissingRequestSchema = require('./schemas/MissingRequest')

const MissingRequestModel = mongoose.model('missingrequests', MissingRequestSchema)

module.exports = MissingRequestModel
