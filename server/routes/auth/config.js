const express = require('express');
const { getAdminAppConfig } = require('../../controllers/auth/config');

const router = express.Router();

router.post('/config', getAdminAppConfig );

module.exports = router;
