const mongoose = require('mongoose')
const { DAY_KEYS } = require('../../configs')
const Schema = mongoose.Schema

const ShiftSchema = new Schema({
    workingAtId: { type: Schema.Types.ObjectId, required: true },
    day: { type: String, enum: DAY_KEYS, required: true },
    start: { type: String, required: true, default: '08:00' },
    end: { type: String, required: true, default: '17:00' },
    isOvernight: { type: Boolean, default: false },
    isAvailable: { type: Boolean, required: true, default: true },
});

ShiftSchema.index({ 'workingHours.day': 1 }, { name: 'day_idx' });

module.exports = ShiftSchema