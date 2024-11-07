const mongoose = require('mongoose')
const RetailSchema = require('./schemas/Retail')

const RetailModel = mongoose.model('retails', RetailSchema)

module.exports = RetailModel
