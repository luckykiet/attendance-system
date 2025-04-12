const mongoose = require('mongoose')
const AbsenceRequestSchema = require('./schemas/AbsenceRequest')

const AbsenceRequest = mongoose.model('absencerequests', AbsenceRequestSchema)

module.exports = AbsenceRequest
