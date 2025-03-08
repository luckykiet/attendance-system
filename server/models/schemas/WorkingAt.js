const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const dayjs = require('dayjs');


const WorkingAtSchema = new Schema(
    {
        employeeId: { type: Schema.Types.ObjectId, required: true },
        registerId: { type: Schema.Types.ObjectId, required: true },
        position: { type: String, trim: true },
        userId: { type: Schema.Types.ObjectId, required: true },
        isAvailable: { type: Boolean, default: true }
    },
    {
        timestamps: true,
    }
);

WorkingAtSchema.index({ employeeId: 1, registerId: 1 }, { unique: true });
WorkingAtSchema.index({ registerId: 1 });

WorkingAtSchema.pre(
    ['save', 'findOneAndUpdate', 'updateOne', 'updateMany'],
    function (next) {
        this.updatedAt = dayjs().toDate();
        next();
    }
);

module.exports = WorkingAtSchema;
