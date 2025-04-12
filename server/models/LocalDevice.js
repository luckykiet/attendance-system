const mongoose = require('mongoose')
const LocalDeviceSchema = require('./schemas/LocalDevice')

const LocalDevice = mongoose.model('localdevices', LocalDeviceSchema)

module.exports = LocalDevice
