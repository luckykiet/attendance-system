const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const WorkingHourSchema = require('./WorkingHour');

const checkSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    distance: { type: Number, required: true }
  },
  {
    _id: false
  }
);

const BreakSchema = new Schema(
  {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    reason: { type: String, required: true }
  },
  { _id: false }
);

const AttendanceSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, required: true },
    registerId: { type: Schema.Types.ObjectId, required: true },
    dailyAttendanceId: { type: Schema.Types.ObjectId, required: true },
    checkInTime: { type: Date, required: true },
    checkInLocation: { type: checkSchema, required: true },
    checkOutTime: { type: Date },
    checkOutLocation: { type: checkSchema },
    breaks: { type: [BreakSchema], default: [] },
    workingHour: { type: WorkingHourSchema, required: true },
  },
  {
    timestamps: true,
  }
);

// Unique on the combination of dailyAttendanceId, employeeId, and shiftNumber
AttendanceSchema.index({ dailyAttendanceId: 1, employeeId: 1, shiftNumber: 1 }, { unique: true });
AttendanceSchema.index({ registerId: 1 });
AttendanceSchema.index({ employeeId: 1 });
AttendanceSchema.index({ checkInTime: 1 });

module.exports = AttendanceSchema;