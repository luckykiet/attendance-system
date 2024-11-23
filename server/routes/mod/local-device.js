const express = require('express');
const { deleteLocalDevice } = require('../../controllers/mod/local-device');

const router = express.Router();

router.delete('/:localDeviceId', deleteLocalDevice);

module.exports = router;
