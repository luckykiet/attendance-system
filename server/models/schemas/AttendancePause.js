
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CheckSchema = require('./Check');

const AttendancePauseSchema = new Schema(
    {
        name: { type: String, required: true },
        checkInTime: { type: Date, required: true },
        checkInLocation: { type: CheckSchema, required: true },
        checkOutTime: { type: Date },
        checkOutLocation: { type: CheckSchema },
    }
);

module.exports = AttendancePauseSchema;