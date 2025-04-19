const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { setUpdatedAt } = require('./utils');
const WorkingHourSchema = require('./WorkingHour');

const DailyAttendanceSchema = new Schema(
  {
    date: { type: Number, required: true }, // Format: YYYYMMDD
    registerId: { type: Schema.Types.ObjectId, required: true },
    workingHour: { type: WorkingHourSchema, required: true },

    expectedShifts: [
      {
        employeeId: { type: Schema.Types.ObjectId, required: true },
        shiftId: { type: Schema.Types.ObjectId, required: true },
        start: { type: String, required: true },
        end: { type: String, required: true },
        isOverNight: { type: Boolean, default: false },
        allowedOvertime: { type: Number, default: 0 }, // in minutes
      }
    ],

    attendanceIds: [{ type: Schema.Types.ObjectId }],

    checkedInOnTime: { type: Number, default: 0 },
    checkedInLate: { type: Number, default: 0 },
    checkedOutOnTime: { type: Number, default: 0 },
    checkedOutEarly: { type: Number, default: 0 },

    checkedInOnTimeByEmployee: { type: Map, of: Number },
    checkedInLateByEmployee: { type: Map, of: Number },
    checkedOutOnTimeByEmployee: { type: Map, of: Number },
    checkedOutEarlyByEmployee: { type: Map, of: Number },

    missingEmployeeIds: [{ type: Schema.Types.ObjectId }],
    missingEmployees: { type: Number, default: 0 },

    workingHoursByEmployee: [
      {
        employeeId: { type: Schema.Types.ObjectId, required: true },
        shiftId: { type: Schema.Types.ObjectId, required: true },
        minutes: { type: Number, required: true },
      }
    ],

    confirmed: { type: Boolean, default: false }, 
  },
  {
    timestamps: true,
  }
);

DailyAttendanceSchema.index({ date: 1, registerId: 1 }, { unique: true });

DailyAttendanceSchema.pre(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], setUpdatedAt);

module.exports = DailyAttendanceSchema;
