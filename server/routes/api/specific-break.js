const express = require('express');
const { applySpecificBreak } = require('../../controllers/api/specific-break');
const router = express.Router();

router.post('/', applySpecificBreak);

module.exports = router;