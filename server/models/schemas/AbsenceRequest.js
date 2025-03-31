const mongoose = require('mongoose');
const { setUpdatedAt } = require('./utils');
const Schema = mongoose.Schema;
const dayjs = require('dayjs');


const today = dayjs().startOf('day').toDate();

const LogSchema = new Schema({
    status: { type: String, enum: ['pending', 'approved', 'rejected'] },
    userId: { type: Schema.Types.ObjectId, required: true },
    createdAt: { type: Date, required: true, default: today }
})

const DaySchema = new Schema({
    date: { type: Number, required: true }, //YYYYMMDD
    start: { type: String, required: true }, //HH:mm
    end: { type: String, required: true }, //HH:mm
    isOverNight: { type: Boolean, required: true},
})

const AbsenceRequestSchema = new Schema(
    {
        attendanceIds: { type: [Schema.Types.ObjectId], default: [] },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], required: true, default: 'pending' },
        reason: { type: String, default: '' },
        notes: { type: String, default: '' },
        logs: { type: [LogSchema], default: [] },
        days: { type: [DaySchema], default: [] },
        start: { type: Number, default: null }, //YYYYMMDD
        end: { type: Number,  default: null }, //YYYYMMDD
        registerId: { type: Schema.Types.ObjectId, required: true },
        employeeId: { type: Schema.Types.ObjectId, required: true },
        createdAt: { type: Date, required: true, default: today },
    },
    {
        strict: true,
        timestamps: true,
    }
);

AbsenceRequestSchema.pre(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], setUpdatedAt);

AbsenceRequestSchema.index({ createdAt: 1 }, { name: 'created_at_idx' });
AbsenceRequestSchema.index({ registerId: 1, employeeId: 1 }, { name: 'register_employee_idx' });
AbsenceRequestSchema.index({ status: 1 }, { name: 'status_idx' });
AbsenceRequestSchema.index({ start: 1 }, { name: 'start_idx' });
AbsenceRequestSchema.index({ end: 1 }, { name: 'end_idx' });

module.exports = AbsenceRequestSchema
