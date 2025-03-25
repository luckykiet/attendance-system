const express = require('express');
const { getRegister, updateRegister, createRegister, deleteRegister } = require('../../controllers/mod/register');
const { checkPrivilege } = require('../../middlewares/privileges');
const { validate } = require('../../middlewares/validation');
const { NewRegisterValidation, UpdateRegisterValidation } = require('../../validation/register');

const router = express.Router();

router.get('/:id', getRegister);

router.put('/', checkPrivilege(['editRegister']), validate(UpdateRegisterValidation), updateRegister);

router.post('/', checkPrivilege(['addRegister']), validate(NewRegisterValidation), createRegister);

router.delete('/:id', checkPrivilege(['addRegister']), deleteRegister);

module.exports = router;
