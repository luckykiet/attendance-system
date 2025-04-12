const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const checkSchema = new Schema(
    {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        distance: { type: Number, required: true }
    },
    {
        _id: false
    }
);

module.exports = checkSchema;
