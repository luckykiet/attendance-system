const express = require('express')
const router = express.Router()

const { ipAddress } = require('../../middlewares')

router.get('/ip', ipAddress.checkIpAddress);
router.get('/ping', (req, res) => { res.json({ success: true }) })

module.exports = router