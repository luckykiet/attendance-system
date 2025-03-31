const mongoose = require('mongoose')
const AbsenceRequestSchema = require('./schemas/AbsenceRequest')

const AbsenceRequestModel = mongoose.model('absencerequests', AbsenceRequestSchema)

module.exports = AbsenceRequestModel
