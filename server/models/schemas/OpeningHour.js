const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OpeningHourSchema = new Schema(
    {
        open: { type: String, required: true, default: '08:00' },
        close: { type: String, required: true, default: '17:00' },
        isOpen: { type: Boolean, required: true, default: true },
    },
    {
        _id: false,
    }
)

module.exports = OpeningHourSchema