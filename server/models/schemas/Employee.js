const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const dayjs = require('dayjs');

const EmployeeSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, trim: true },
        phone: { type: String, trim: true },

        registerIds: [{ type: Schema.Types.ObjectId, default: [], required: true }],

        publicKey: { type: String, required: true },

        position: { type: String, trim: true },
        isActive: { type: Boolean, default: true }
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

EmployeeSchema.methods.verifyPublicKey = function (providedKey) {
    return this.publicKey === providedKey;
};

EmployeeSchema.methods.isAssociatedWithCompany = function (registerId) {
    return this.registerIds.includes(registerId);
};

module.exports = EmployeeSchema;
