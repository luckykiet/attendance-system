const express = require('express');
const { updateWorkingAts } = require('../../controllers/mod/working-ats');

const router = express.Router();

router.post('/', updateWorkingAts);

module.exports = router;