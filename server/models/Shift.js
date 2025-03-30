const mongoose = require('mongoose')
const ShiftSchema = require('./schemas/Shift')

const ShiftModel = mongoose.model('shifts', ShiftSchema)

module.exports = ShiftModel
