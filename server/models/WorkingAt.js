const mongoose = require('mongoose')
const WorkingAtSchema = require('./schemas/WorkingAt')

const WorkingAt = mongoose.model('workingat', WorkingAtSchema)

module.exports = WorkingAt
