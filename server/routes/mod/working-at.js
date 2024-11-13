const express = require('express');
const { createOrUpdateWorkingAt } = require('../../controllers/mod/working-at');

const router = express.Router();

router.post('/', createOrUpdateWorkingAt);

module.exports = router;