const express = require('express');
const { getRegisters } = require('../../controllers/mod/registers');

const router = express.Router();

router.get('/', getRegisters);

module.exports = router;
