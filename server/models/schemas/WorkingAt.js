const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { setUpdatedAt } = require('./utils');
const Shift = require('./Shift');
const { DAY_KEYS } = require('../../configs');

const WorkingAtSchema = new Schema(
    {
        employeeId: { type: Schema.Types.ObjectId, required: true },
        registerId: { type: Schema.Types.ObjectId, required: true },
        position: { type: String, trim: true },
        userId: { type: Schema.Types.ObjectId, required: true },
        isAvailable: { type: Boolean, default: true },
        shifts: {
            type: Map,
            of: [Shift],
            default: () =>
                DAY_KEYS.reduce((acc, day) => {
                    acc[day] = [];
                    return acc;
                }, {}),
        }
    },
    {
        strict: true,
        timestamps: true,
    }
);

WorkingAtSchema.pre(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], setUpdatedAt);

WorkingAtSchema.index({ employeeId: 1, registerId: 1 }, { unique: true });
WorkingAtSchema.index({ registerId: 1 });

module.exports = WorkingAtSchema;
