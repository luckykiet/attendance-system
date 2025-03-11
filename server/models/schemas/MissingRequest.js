const mongoose = require('mongoose');
const { setUpdatedAt } = require('./utils');

const Schema = mongoose.Schema;

const LogSchema = new Schema({
    status: { type: String, enum: ['pending', 'approved', 'rejected'] },
    userId: { type: Schema.Types.ObjectId, required: true },
    createdAt: { type: Date, required: true, default: Date.now }
})

const MissingRequestSchema = new Schema(
    {
        attendanceIds: { type: [Schema.Types.ObjectId], required: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], required: true, default: 'pending' },
        logs: { type: [LogSchema], default: [] },
        registerId: { type: Schema.Types.ObjectId, required: true },
        employeeId: { type: Schema.Types.ObjectId, required: true },
        createdAt: { type: Date, required: true, default: Date.now },
    },
    {
        strict: true,
        timestamps: true,
    }
);

MissingRequestSchema.pre(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], setUpdatedAt);

MissingRequestSchema.index({ createdAt: 1 }, { name: 'created_at_idx' });
MissingRequestSchema.index({ registerId: 1, employeeId: 1 }, { name: 'register_employee_idx' });

module.exports = MissingRequestSchema
