const express = require('express');
const { getRegister, updateRegister, createRegister, deleteRegister } = require('../../controllers/mod/register');

const router = express.Router();

router.get('/:id', getRegister);

router.put('/', updateRegister);

router.post('/', createRegister);

router.delete('/:id', deleteRegister);

module.exports = router;
