const mongoose = require('mongoose');
const { setIsOverNight } = require('./utils');

const Schema = mongoose.Schema;

const BreakSchema = new Schema({
    start: { type: String, required: true },
    end: { type: String, required: true },
    name: { type: String, required: true },
    duration: { type: Number, default: 15 }, // In minutes
    isOverNight: { type: Boolean, required: true },
});

BreakSchema.pre(['save', 'findOneAndUpdate', 'updateOne'], setIsOverNight);

module.exports = BreakSchema;
