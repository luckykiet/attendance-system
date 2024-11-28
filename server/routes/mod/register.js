const express = require('express');
const { getRegister, updateRegister, createRegister, deleteRegister } = require('../../controllers/mod/register');
const { checkPrivilege } = require('../../middlewares/privileges');

const router = express.Router();

router.get('/:id', getRegister);

router.put('/', checkPrivilege(['editRegister']), updateRegister);

router.post('/', checkPrivilege(['addRegister']), createRegister);

router.delete('/:id', checkPrivilege(['addRegister']), deleteRegister);

module.exports = router;
