const mongoose = require('mongoose')
const DailyAttendanceSchema = require('./schemas/DailyAttendance')

const DailyAttendanceModel = mongoose.model('dailyattendances', DailyAttendanceSchema)

module.exports = DailyAttendanceModel
