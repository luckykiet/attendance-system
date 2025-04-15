const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { setUpdatedAt } = require('./utils');
const CheckSchema = require('./Check');
const AttendanceBreakSchema = require('./AttendanceBreak');
const AttendancePauseSchema = require('./AttendancePause');

const AttendanceSchema = new Schema(
  {
    workingAtId: { type: Schema.Types.ObjectId, required: true },
    dailyAttendanceId: { type: Schema.Types.ObjectId, required: true },

    checkInTime: { type: Date, required: true },
    checkInLocation: { type: CheckSchema, required: true },
    checkOutTime: { type: Date },
    checkOutLocation: { type: CheckSchema },
    reason: { type: String, default: '' },
    pauses: { type: [AttendancePauseSchema], default: [] },
    breaks: { type: [AttendanceBreakSchema], default: [] },

    shiftId: { type: Schema.Types.ObjectId, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    isOverNight: { type: Boolean, required: true },
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.pre(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], setUpdatedAt);
// Unique on the combination of dailyAttendanceId, employeeId, and shiftId
AttendanceSchema.index({ dailyAttendanceId: 1, workingAtId: 1, shiftId: 1 }, { unique: true });
AttendanceSchema.index({ workingAtId: 1 });
AttendanceSchema.index({ checkInTime: 1 });


module.exports = AttendanceSchema;