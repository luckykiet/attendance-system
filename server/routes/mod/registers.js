const express = require('express');
const { getRegisters } = require('../../controllers/mod/registers');

const router = express.Router();

router.post('/', getRegisters);

module.exports = router;
