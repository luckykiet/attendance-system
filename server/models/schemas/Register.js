const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AddressSchema = require('./Address');
const WorkingHourSchema = require('./WorkingHour');
const dayjs = require('dayjs');

const RegisterSchema = new Schema(
    {
        retailId: { type: Schema.Types.ObjectId, required: true },
        name: { type: String, required: true, trim: true },
        address: { type: AddressSchema, required: true },

        location: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            allowedRadius: { type: Number, required: true, default: 100 } // Radius in meters for allowed check-ins
        },

        workingHours: {
            mon: { type: WorkingHourSchema, required: true },
            tue: { type: WorkingHourSchema, required: true },
            wed: { type: WorkingHourSchema, required: true },
            thu: { type: WorkingHourSchema, required: true },
            fri: { type: WorkingHourSchema, required: true },
            sat: { type: WorkingHourSchema, required: true },
            sun: { type: WorkingHourSchema, required: true },
        },

        isAvailable: { type: Boolean, required: true, default: true },
    },
    {
        strict: true,
        timestamps: true,
    }
);

RegisterSchema.pre(
    ['save', 'findOneAndUpdate', 'updateOne', 'updateMany'],
    function (next) {
        this.updatedAt = dayjs().toDate();
        next();
    }
);

module.exports = RegisterSchema;
