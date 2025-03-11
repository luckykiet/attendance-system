const mongoose = require('mongoose')
const { DAY_KEYS } = require('../../configs');
const { setUpdatedAt } = require('./utils');
const Schema = mongoose.Schema

const ShiftSchema = new Schema({
    workingAtId: { type: Schema.Types.ObjectId, required: true },
    day: { type: String, enum: DAY_KEYS, required: true },
    start: { type: String, required: true, default: '08:00' },
    end: { type: String, required: true, default: '17:00' },
    isOverNight: { type: Boolean, default: false },
    isAvailable: { type: Boolean, required: true, default: true },
}, { strict: true, timestamps: true });

ShiftSchema.index({ 'workingHours.day': 1 }, { name: 'day_idx' });

ShiftSchema.pre(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], setUpdatedAt);

module.exports = ShiftSchema