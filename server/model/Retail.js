const mongoose = require('mongoose')
const RetailSchema = require('./schema/Retail')

const RetailModel = mongoose.model('retails', RetailSchema)

module.exports = RetailModel
