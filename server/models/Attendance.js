const mongoose = require('mongoose')
const AttendanceSchema = require('./schemas/Attendance')

const AttendanceModel = mongoose.model('attendances', AttendanceSchema)

module.exports = AttendanceModel
