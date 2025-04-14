const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ShiftSchema = new Schema({
    start: { type: String, required: true},
    end: { type: String, required: true },
    allowedOverTime: { type: Number, required: true, default: 5 }, // in minutes
    isOverNight: { type: Boolean, required: true },
    isAvailable: { type: Boolean, required: true, default: true },
}, { strict: true, timestamps: true});

module.exports = ShiftSchema