const mongoose = require('mongoose')
const Schema = mongoose.Schema
const AddressSchema = require('./Address')
const { setUpdatedAt } = require('./utils')

const RetailSchema = new Schema(
    {
        tin: { type: String, required: true, unique: true, trim: true },
        vin: { type: String, default: '', trim: true },
        name: { type: String, required: true, trim: true },
        address: { type: AddressSchema, required: true },

        isAvailable: { type: Boolean, required: true, default: true },
    },
    {
        strict: true,
        timestamps: true,
    }
)

RetailSchema.pre(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], setUpdatedAt)

module.exports = RetailSchema
