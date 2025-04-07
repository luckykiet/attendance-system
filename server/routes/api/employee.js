const express = require('express');
const { cancelDevicePairing } = require('../../controllers/api/employee');
const router = express.Router();
const { ensureTokenVerified } = require('../../middlewares/auth');

router.post('/cancel-pairing', ensureTokenVerified, cancelDevicePairing);

module.exports = router;