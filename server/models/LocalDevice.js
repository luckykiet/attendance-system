const mongoose = require('mongoose')
const LocalDeviceSchema = require('./schemas/LocalDevice')

const LocalDeviceModel = mongoose.model('localdevices', LocalDeviceSchema)

module.exports = LocalDeviceModel
