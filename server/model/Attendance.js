const mongoose = require('mongoose')
const AttendanceSchema = require('./schema/Attendance')

const AttendanceModel = mongoose.model('attendances', AttendanceSchema)

module.exports = AttendanceModel
