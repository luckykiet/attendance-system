const mongoose = require('mongoose')
const WorkingAtSchema = require('./schemas/WorkingAt')

const WorkingAtModel = mongoose.model('workingat', WorkingAtSchema)

module.exports = WorkingAtModel
