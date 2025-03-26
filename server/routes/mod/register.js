const express = require('express');
const { getRegister, updateRegister, createRegister, deleteRegister } = require('../../controllers/mod/register');
const { checkPrivilege } = require('../../middlewares/privileges');
const { validate } = require('../../middlewares/validation');
const { NewRegisterValidation, UpdateRegisterValidation, GetRegisterValidation, DeleteRegisterValidation } = require('../../validation/register');

const router = express.Router();

router.get('/:id', validate(GetRegisterValidation), getRegister);

router.put('/', checkPrivilege(['editRegister']), validate(UpdateRegisterValidation), updateRegister);

router.post('/', checkPrivilege(['addRegister']), validate(NewRegisterValidation), createRegister);

router.delete('/:id', checkPrivilege(['addRegister']), validate(DeleteRegisterValidation), deleteRegister);

module.exports = router;
