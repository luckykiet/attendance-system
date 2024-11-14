const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AddressSchema = require('./Address');
const WorkingHourSchema = require('./WorkingHour');

const RegisterSchema = new Schema(
    {
        retailId: { type: Schema.Types.ObjectId, required: true },
        name: { type: String, required: true, trim: true },
        address: { type: AddressSchema, required: true },

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

        isAvailable: { type: Boolean, required: true, default: true },
    },
    {
        strict: true,
        timestamps: true,
        toObject: { virtuals: true, transform: transformLocation },
        toJSON: { virtuals: true, transform: transformLocation },
    }
);

// Transform function to reshape `location` field
function transformLocation(doc, ret) {
    if (ret.location && ret.location.type === 'Point') {
        ret.location = {
            latitude: ret.location.coordinates[1],
            longitude: ret.location.coordinates[0],
            allowedRadius: ret.location.allowedRadius,
        };
    }
    return ret;
}

RegisterSchema.index({ location: '2dsphere' });

module.exports = RegisterSchema;
