const express = require('express');
const { createOrUpdateWorkingAt } = require('../../controllers/mod/working-at');
const { createOrUpdateWorkingAtValidation } = require('../../validation/working-at');
const { validate } = require('../../middlewares/validation');
const router = express.Router();

router.post('/', validate(createOrUpdateWorkingAtValidation), createOrUpdateWorkingAt);

module.exports = router;