const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { setUpdatedAt } = require('./utils');
const { SPECIFIC_BREAKS } = require('../../configs');

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
    name: { type: String, required: true },
    type: { type: String, enum: [...SPECIFIC_BREAKS, 'other', 'generic'], default: 'other', required: true },
    reason: { type: String, required: true },
    breakHours: {
      start: { type: String, required: true },
      end: { type: String, required: true },
      isOverNight: { type: Boolean, required: true, default: false },
    },
    checkInTime: { type: Date, required: true },
    checkInLocation: { type: checkSchema, required: true },
    checkOutTime: { type: Date },
    checkOutLocation: { type: checkSchema },
  },
  { _id: false }
);

const AttendanceSchema = new Schema(
  {
    workingAtId: { type: Schema.Types.ObjectId, required: true },
    dailyAttendanceId: { type: Schema.Types.ObjectId, required: true },

    checkInTime: { type: Date, required: true },
    checkInLocation: { type: checkSchema, required: true },
    checkOutTime: { type: Date },
    checkOutLocation: { type: checkSchema },

    breaks: { type: [BreakSchema], default: [] },

    shiftId: { type: Schema.Types.ObjectId, required: true },
    start: { type: String, required: true},
    end: { type: String, required: true },
    isOverNight: { type: Boolean, required: true },
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.pre(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], setUpdatedAt);
// Unique on the combination of dailyAttendanceId, employeeId, and shiftId
AttendanceSchema.index({ dailyAttendanceId: 1, employeeId: 1, shiftId: 1 }, { unique: true });
AttendanceSchema.index({ registerId: 1 });
AttendanceSchema.index({ employeeId: 1 });
AttendanceSchema.index({ checkInTime: 1 });


module.exports = AttendanceSchema;