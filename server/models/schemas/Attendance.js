const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const checkSchema = new Schema(
    {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        distance: { type: Number, required: true }
    },
    {
        _id: false
    }
)

const AttendanceSchema = new Schema(
    {
        employeeId: { type: Schema.Types.ObjectId, required: true },
        registerId: { type: Schema.Types.ObjectId, required: true },
        dailyAttendanceId: { type: Schema.Types.ObjectId, required: true },
        checkInTime: { type: Date, required: true },
        checkInLocation: { type: checkSchema, required: true },
        checkOutTime: { type: Date },
        checkOutLocation: { type: checkSchema }
    },
    {
        timestamps: true,
    }
);

AttendanceSchema.index({ dailyAttendanceId: 1, employeeId: 1, }, { unique: true });
AttendanceSchema.index({ registerId: 1 });

module.exports = AttendanceSchema;
