const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const dayjs = require('dayjs');
const WorkingHourSchema = require('./WorkingHour');

const WorkingAtSchema = new Schema(
    {
        employeeId: { type: Schema.Types.ObjectId, required: true },
        registerId: { type: Schema.Types.ObjectId, required: true },
        workingHours: {
            mon: { type: WorkingHourSchema, required: true },
            tue: { type: WorkingHourSchema, required: true },
            wed: { type: WorkingHourSchema, required: true },
            thu: { type: WorkingHourSchema, required: true },
            fri: { type: WorkingHourSchema, required: true },
            sat: { type: WorkingHourSchema, required: true },
            sun: { type: WorkingHourSchema, required: true },
        },
        position: { type: String, trim: true },
        userId: { type: Schema.Types.ObjectId, required: true },
        isAvailable: { type: Boolean, default: true }
    },
    {
        timestamps: true,
    }
);

WorkingAtSchema.index({ employeeId: 1, registerId: 1 }, { unique: true });

WorkingAtSchema.pre(
    ['save', 'findOneAndUpdate', 'updateOne', 'updateMany'],
    function (next) {
        this.updatedAt = dayjs().toDate();
        next();
    }
);

module.exports = WorkingAtSchema;
