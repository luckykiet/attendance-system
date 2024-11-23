const express = require('express')
const { registerLocalDevice, unregisterLocalDevice, renewUUID } = require('../../controllers/api/local-device')
const router = express.Router()

router.post('/register', registerLocalDevice)
router.post('/unregister', unregisterLocalDevice)
router.post('/renew', renewUUID)

module.exports = router
