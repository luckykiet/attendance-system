const express = require('express');
const { getConfig } = require('../../controllers/auth/config');

const router = express.Router();

router.post('/config', getConfig );

module.exports = router;
