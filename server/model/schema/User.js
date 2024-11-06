const mongoose = require('mongoose')
const Schema = mongoose.Schema
const dayjs = require('dayjs')

const UserSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, trim: true },
        name: { type: String, trim: true, default: '' },
        username: {
            type: String, trim: true, required: true, unique: true, match: [/^(?!.*__)[a-z0-9_]+$/],
        },
        password: { type: String, required: true },
        role: { type: String, default: 'admin', },
        notes: { type: String, trim: true, default: '' },
        isAvailable: { type: Boolean, required: true, default: true },
    },
    {
        strict: true,
        timestamps: true,
    }
)


UserSchema.pre(
    ['save', 'findOneAndUpdate', 'updateOne', 'updateMany'],
    function (next) {
        this.updatedAt = dayjs().toDate()
        next()
    }
)
module.exports = UserSchema
