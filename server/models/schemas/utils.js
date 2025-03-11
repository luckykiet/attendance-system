const mongoose = require('mongoose');
const dayjs = require('dayjs');
const utils = require('../../utils');

function setIsOverNight(next) {
    const data = this instanceof mongoose.Query ? this.getUpdate() : this;

    if (data.start && data.end) {
        data.isOverNight = utils.isOverNight(data.start, data.end);
        if (this instanceof mongoose.Query) {
            this.setUpdate(data);
        }
    }
    next();
};

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

function setUpdatedAt(next) {
    this.updatedAt = dayjs().toDate();
    next();
}

module.exports = {
    setIsOverNight,
    transformLocation,
    setUpdatedAt
};