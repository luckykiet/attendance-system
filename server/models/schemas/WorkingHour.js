const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WorkingHourSchema = new Schema(
    {
        start: { type: String, required: true, default: '08:00' },
        end: { type: String, required: true, default: '17:00' },
        isAvailable: { type: Boolean, required: true, default: true },
    },
    {
        _id: false,
    }
)

module.exports = WorkingHourSchema