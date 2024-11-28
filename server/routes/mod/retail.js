const express = require('express');
const { getRetail, updateRetail } = require('../../controllers/mod/retail');
const { checkPrivilege } = require('../../middlewares/privileges');

const router = express.Router();

router.get('/', getRetail);

router.put('/', checkPrivilege(['editRetail']), updateRetail);

module.exports = router;
