const express = require('express');
const { applyPause } = require('../../controllers/api/pause');
const router = express.Router();

router.post('/', applyPause);

module.exports = router;