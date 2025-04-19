const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { setUpdatedAt } = require('./utils');
const WorkingHourSchema = require('./WorkingHour');

const DailyAttendanceSchema = new Schema(
  {
    date: { type: Number, required: true }, // Format: YYYYMMDD
    registerId: { type: Schema.Types.ObjectId, required: true },
    workingHour: { type: WorkingHourSchema, required: true }, // optional: register-wide working hour config

    // Expected employees for this day, by WorkingAt & shift
    expectedEmployees: [{
      employeeId: { type: Schema.Types.ObjectId, required: true },
      shiftId: { type: Schema.Types.ObjectId, required: true },
      shiftStart: { type: String, required: true }, // "08:00"
      shiftEnd: { type: String, required: true },   // "16:00"
      isOverNight: { type: Boolean, default: false }
    }],

    // Actual attendances (linked to Attendance model)
    attendanceIds: [{ type: Schema.Types.ObjectId }],

    // Aggregated evaluation
    checkedInOnTime: [{ type: Schema.Types.ObjectId }],
    checkedInLate: [{ type: Schema.Types.ObjectId }],
    missingCheckIn: [{ type: Schema.Types.ObjectId }],

    checkedOutOnTime: [{ type: Schema.Types.ObjectId }],
    checkedOutEarly: [{ type: Schema.Types.ObjectId }],
    missingCheckOut: [{ type: Schema.Types.ObjectId }],

    workingHoursByEmployee: {
      type: Map,
      of: Number // minutes worked
    },
  },
  {
    timestamps: true,
  }
);

DailyAttendanceSchema.index({ date: 1, registerId: 1 }, { unique: true });

DailyAttendanceSchema.pre(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], setUpdatedAt);

module.exports = DailyAttendanceSchema;
