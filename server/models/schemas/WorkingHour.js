const mongoose = require('mongoose');
const { setIsOverNight } = require('./utils');
const Schema = mongoose.Schema

const WorkingHourSchema = new Schema(
    {
        start: { type: String, required: true, default: '08:00' },
        end: { type: String, required: true, default: '17:00' },
        isOverNight: { type: Boolean, required: true, default: false },
        isAvailable: { type: Boolean, required: true, default: true },
    },
    {
        _id: false,
    }
)

WorkingHourSchema.pre(['save', 'findOneAndUpdate', 'updateOne'], setIsOverNight);

module.exports = WorkingHourSchema