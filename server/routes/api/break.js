const express = require('express');
const { applyBreak } = require('../../controllers/api/break');
const router = express.Router();

router.post('/', applyBreak);

module.exports = router;