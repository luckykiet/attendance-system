const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AddressSchema = require('./Address');
const WorkingHourSchema = require('./WorkingHour');
const BreakSchema = require('./Break');
const SpecificBreakSchema = require('./SpecificBreak');
const { transformLocation, setUpdatedAt } = require('./utils');

const RegisterSchema = new Schema(
    {
        retailId: { type: Schema.Types.ObjectId, required: true },
        name: { type: String, required: true, trim: true },
        address: { type: AddressSchema, required: true }, // Address    

        location: {
            type: { type: String, enum: ['Point'], required: true, default: 'Point' },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true,
                validate: {
                    validator: function (value) {
                        return value.length === 2;
                    },
                    message: 'Coordinates must be an array of [longitude, latitude]'
                }
            },
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

        specificBreaks: {
            mon: { type: [SpecificBreakSchema], required: true, default: [] },
            tue: { type: [SpecificBreakSchema], required: true, default: [] },
            wed: { type: [SpecificBreakSchema], required: true, default: [] },
            thu: { type: [SpecificBreakSchema], required: true, default: [] },
            fri: { type: [SpecificBreakSchema], required: true, default: [] },
            sat: { type: [SpecificBreakSchema], required: true, default: [] },
            sun: { type: [SpecificBreakSchema], required: true, default: [] },
        },

        breaks: {
            mon: { type: [BreakSchema], required: true, default: [] },
            tue: { type: [BreakSchema], required: true, default: [] },
            wed: { type: [BreakSchema], required: true, default: [] },
            thu: { type: [BreakSchema], required: true, default: [] },
            fri: { type: [BreakSchema], required: true, default: [] },
            sat: { type: [BreakSchema], required: true, default: [] },
            sun: { type: [BreakSchema], required: true, default: [] },
        },

        maxLocalDevices: { type: Number, required: true, default: 0 },
        isAvailable: { type: Boolean, required: true, default: true },
    },
    {
        strict: true,
        timestamps: true,
        toObject: { virtuals: true, transform: transformLocation },
        toJSON: { virtuals: true, transform: transformLocation },
    }
);

RegisterSchema.pre(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], setUpdatedAt);
RegisterSchema.index({ location: '2dsphere' });

module.exports = RegisterSchema;
