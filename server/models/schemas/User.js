const mongoose = require('mongoose')
const Schema = mongoose.Schema

const { setUpdatedAt } = require('./utils')

const UserSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, trim: true },
        username: { type: String, trim: true, required: true, unique: true, match: [/^(?!.*__)[a-z0-9_]+$/] },

        name: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
        password: { type: String },
        role: { type: String, default: 'Admin', },
        notes: { type: String, trim: true, default: '' },

        tokens: { type: [String], default: [] },
        retailId: { type: Schema.Types.ObjectId, required: true },
        isAvailable: { type: Boolean, required: true, default: true },
    },
    {
        strict: true,
        timestamps: true,
    }
)

UserSchema.pre(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], setUpdatedAt)
module.exports = UserSchema
