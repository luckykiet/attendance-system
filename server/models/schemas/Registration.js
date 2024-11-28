const mongoose = require('mongoose');
const { Schema } = mongoose;

const RegistrationSchema = new Schema({
    tokenId: { type: String, required: true, unique: true, },
    employeeId: { type: Schema.ObjectId, required: true, },
    retailId: { type: Schema.ObjectId, required: true, },
    isDemo: { type: Boolean, default: false, },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '15m',
    },
}, { timestamps: true });

RegistrationSchema.index({ employeeId: 1, retailId: 1, }, { unique: true });

module.exports = RegistrationSchema;