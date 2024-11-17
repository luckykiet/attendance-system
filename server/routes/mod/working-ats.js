const express = require('express');
const { updateOrCreateWorkingAts } = require('../../controllers/mod/working-ats');

const router = express.Router();

router.post('/', updateOrCreateWorkingAts);

module.exports = router;