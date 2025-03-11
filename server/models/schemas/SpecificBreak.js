const mongoose = require('mongoose');
const { setIsOverNight } = require('./utils');
const { SPECIFIC_BREAKS } = require('../../configs');

const Schema = mongoose.Schema;

const SpecificBreakSchema = new Schema({
    start: { type: String, required: true },
    end: { type: String, required: true },
    type: { type: String, enum: SPECIFIC_BREAKS, required: true },
    duration: { type: Number, default: 60 }, // In minutes
    isOverNight: { type: Boolean, required: true },
    isAvailable: { type: Boolean, required: true },
});

SpecificBreakSchema.pre(['save', 'findOneAndUpdate', 'updateOne'], setIsOverNight);

module.exports = SpecificBreakSchema;
