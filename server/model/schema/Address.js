const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AddressSchema = new Schema(
    {
        street: { type: String, default: '', trim: true },
        city: { type: String, default: '', trim: true },
        zip: { type: String, default: '', trim: true },
    },
    {
        _id: false,
    }
)

module.exports = AddressSchema
