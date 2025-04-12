const mongoose = require('mongoose')
const AttendanceSchema = require('./schemas/Attendance')

const Attendance = mongoose.model('attendances', AttendanceSchema)

module.exports = Attendance
