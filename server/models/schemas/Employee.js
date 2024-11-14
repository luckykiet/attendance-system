const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const dayjs = require('dayjs');

const EmployeeSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, trim: true, required: true },
        phone: { type: String, trim: true },

        retailId: { type: Schema.Types.ObjectId, required: true },

        publicKey: { type: String },

        deviceId: { type: String, trim: true },
        isAvailable: { type: Boolean, default: true }
    },
    {
        timestamps: true,
    }
);

EmployeeSchema.pre(
    ['save', 'findOneAndUpdate', 'updateOne', 'updateMany'],
    function (next) {
        this.updatedAt = dayjs().toDate();
        next();
    }
);

EmployeeSchema.index({ email: 1, retailId: 1, }, { unique: true });
EmployeeSchema.index({ deviceId: 1, }, { unique: true });

EmployeeSchema.index({ name: 1, }, { name: 'name_index' });

EmployeeSchema.methods.verifyPublicKey = function (providedKey) {
    return this.publicKey === providedKey;
};

EmployeeSchema.methods.isAssociatedWithCompany = function (registerId) {
    return this.registerIds.includes(registerId);
};

module.exports = EmployeeSchema;
