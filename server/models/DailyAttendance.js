const mongoose = require('mongoose')
const DailyAttendanceSchema = require('./schemas/DailyAttendance')

const DailyAttendance = mongoose.model('dailyattendances', DailyAttendanceSchema)

module.exports = DailyAttendance
