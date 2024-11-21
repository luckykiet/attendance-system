const express = require('express')
const { registerLocalDevice, unregisterLocalDevice } = require('../../controllers/api/local-device')
const router = express.Router()

router.post('/register', registerLocalDevice)
router.post('/unregister', unregisterLocalDevice)

module.exports = router
