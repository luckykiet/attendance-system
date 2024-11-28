const express = require('express');
const { deleteLocalDevice } = require('../../controllers/mod/local-device');
const { checkPrivilege } = require('../../middlewares/privileges');

const router = express.Router();

router.delete('/:localDeviceId', checkPrivilege(['editRegister']), deleteLocalDevice);

module.exports = router;
