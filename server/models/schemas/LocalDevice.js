const mongoose = require('mongoose');
const { setUpdatedAt } = require('./utils');
const { Schema } = mongoose;

const LocalDeviceSchema = new Schema({
    deviceId: { type: String, required: true },
    registerId: { type: Schema.ObjectId, required: true, },
    uuid: { type: String, required: true, },
    location: {
        latitude: { type: Number, required: true, },
        longitude: { type: Number, required: true, },
        allowedRadius: { type: Number, required: true, default: 100 }, // in meters
    },
}, { timestamps: true });


LocalDeviceSchema.pre(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], setUpdatedAt);

LocalDeviceSchema.index({ deviceId: 1, registerId: 1 }, { unique: true });
LocalDeviceSchema.index({ uuid: 1 });


module.exports = LocalDeviceSchema;