const mongoose = require('mongoose');
const { Schema } = mongoose;

const LocalDeviceSchema = new Schema({
    deviceId: { type: String, required: true, unique: true, },
    registerId: { type: Schema.ObjectId, required: true, },
    uuid: { type: String, required: true, },
    location: {
        latitude: { type: Number, required: true, },
        longitude: { type: Number, required: true, },
        allowedRadius: { type: Number, required: true, default: 100 }, // in meters
    },
}, { timestamps: true });

LocalDeviceSchema.index({ deviceId: 1, registerId: 1, uuid: 1 });

module.exports = LocalDeviceSchema;