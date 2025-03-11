const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { setUpdatedAt } = require('./utils');

const EmployeeSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, trim: true, required: true },
        phone: { type: String, trim: true },

        retailId: { type: Schema.Types.ObjectId, required: true },

        publicKey: { type: String },
        registrationToken: { type: String },
        registeredAt: { type: Date },

        deviceId: { type: String, trim: true },
        isAvailable: { type: Boolean, default: true }
    },
    {
        timestamps: true,
    }
);

EmployeeSchema.pre(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], setUpdatedAt)

EmployeeSchema.index({ email: 1, retailId: 1, }, { unique: true });
EmployeeSchema.index(
    { deviceId: 1, retailId: 1 },
    { unique: true, partialFilterExpression: { deviceId: { $exists: true, $ne: "" } } }
);

EmployeeSchema.index({ name: 1, }, { name: 'name_index' });


module.exports = EmployeeSchema;
