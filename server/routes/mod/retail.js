const express = require('express');
const { getRetail, updateRetail } = require('../../controllers/mod/retail');
const { recaptcha, privileges } = require('../../middlewares');
const router = express.Router();

router.get('/', getRetail);

router.put('/', recaptcha.checkReCaptcha, privileges.checkPrivilege(['editRetail']), updateRetail);

module.exports = router;
