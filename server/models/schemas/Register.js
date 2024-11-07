const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AddressSchema = require('./Address');
const OpeningHourSchema = require('./OpeningHour');
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

        openingHours: {
            mon: { type: OpeningHourSchema, required: true },
            tue: { type: OpeningHourSchema, required: true },
            wed: { type: OpeningHourSchema, required: true },
            thu: { type: OpeningHourSchema, required: true },
            fri: { type: OpeningHourSchema, required: true },
            sat: { type: OpeningHourSchema, required: true },
            sun: { type: OpeningHourSchema, required: true },
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
