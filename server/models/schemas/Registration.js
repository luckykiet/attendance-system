const mongoose = require('mongoose');
const { setUpdatedAt } = require('./utils');
const { Schema } = mongoose;

const RegistrationSchema = new Schema({
    tokenId: { type: String, required: true, unique: true, },
    employeeId: { type: Schema.ObjectId, required: true, },
    retailId: { type: Schema.ObjectId, required: true, },
    isDemo: { type: Boolean, default: false, },
}, { timestamps: true });

RegistrationSchema.pre(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], setUpdatedAt);

RegistrationSchema.index({ employeeId: 1, retailId: 1, }, { unique: true });

module.exports = RegistrationSchema;