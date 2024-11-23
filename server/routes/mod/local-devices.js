const express = require('express');
const { getLocalDevices } = require('../../controllers/mod/local-devices');

const router = express.Router();

router.get('/:registerId', getLocalDevices);

module.exports = router;
