const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AttendanceSchema = new Schema(
    {
        employeeId: { type: Schema.Types.ObjectId, required: true },
        registerId: { type: Schema.Types.ObjectId, required: true },
        checkInTime: { type: Date, required: true },
        checkOutTime: { type: Date },

        // GPS data for location verification
        checkInLocation: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        },
        checkOutLocation: {
            latitude: { type: Number },
            longitude: { type: Number }
        },

        isWithinRange: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Attendance', AttendanceSchema);
