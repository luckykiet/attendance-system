const express = require('express');
const { getRetail, updateRetail } = require('../../controllers/mod/retail');

const router = express.Router();

router.get('/', getRetail);

router.put('/', updateRetail);

module.exports = router;
