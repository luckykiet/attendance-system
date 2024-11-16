const mongoose = require('mongoose');
const { Schema } = mongoose;

const RegistrationSchema = new Schema({
    tokenId: { type: String, required: true, unique: true, },
    employeeId: { type: Schema.ObjectId, required: true, },
    retailId: { type: Schema.ObjectId, required: true, },
    createdAt: { type: Date, default: Date.now, expires: '15m', },
}, { timestamps: true });

module.exports = RegistrationSchema;