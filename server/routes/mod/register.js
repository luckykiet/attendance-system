const express = require('express');
const { getRegister, updateRegister, createRegister, deleteRegister } = require('../../controllers/mod/register');
const { privileges, recaptcha } = require('../../middlewares');
const { validate } = require('../../middlewares/validation');
const { NewRegisterValidation, UpdateRegisterValidation, GetRegisterValidation, DeleteRegisterValidation } = require('../../validation/register');

const router = express.Router();

router.get('/:id', validate(GetRegisterValidation), getRegister);

router.put('/', privileges.checkPrivilege(['editRegister']), recaptcha.checkReCaptcha, validate(UpdateRegisterValidation), updateRegister);

router.post('/', privileges.checkPrivilege(['addRegister']), recaptcha.checkReCaptcha, validate(NewRegisterValidation), createRegister);

router.delete('/:id', privileges.checkPrivilege(['addRegister']), validate(DeleteRegisterValidation), deleteRegister);

module.exports = router;
