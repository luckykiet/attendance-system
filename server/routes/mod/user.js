const express = require('express');
const { getUser, updateUser, createUser, deleteUser } = require('../../controllers/mod/user');
const { privileges, recaptcha } = require('../../middlewares');

const router = express.Router();

router.get('/:id', getUser);

router.put('/', recaptcha.checkReCaptcha, updateUser);

router.post('/', recaptcha.checkReCaptcha, privileges.checkPrivilege(['createUser']), createUser);

router.delete('/:id', privileges.checkPrivilege(['createUser']), deleteUser);

module.exports = router;