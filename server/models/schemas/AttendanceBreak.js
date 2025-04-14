
const { SPECIFIC_BREAKS } = require('../../configs');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CheckSchema = require('./Check');

const AttendanceBreakSchema = new Schema(
    {
        name: { type: String, required: true },
        type: { type: String, enum: [...SPECIFIC_BREAKS, 'other', 'generic'], default: 'other', required: true },
        breakId: { type: Schema.Types.ObjectId, default: null },
        breakHours: {
            start: { type: String, required: true },
            end: { type: String, required: true },
            isOverNight: { type: Boolean, required: true, default: false },
            duration: { type: Number, required: true },
        },
        checkInTime: { type: Date, required: true },
        checkInLocation: { type: CheckSchema, required: true },
        checkOutTime: { type: Date },
        checkOutLocation: { type: CheckSchema },
    }
);

module.exports = AttendanceBreakSchema;