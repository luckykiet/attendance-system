const mongoose = require('mongoose')
const RetailSchema = require('./schemas/Retail')

const Retail = mongoose.model('retails', RetailSchema)

module.exports = Retail
