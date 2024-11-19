const express = require('express');
const { getUser, updateUser, createUser, deleteUser } = require('../../controllers/mod/user');

const router = express.Router();

router.get('/:id', getUser);

router.put('/', updateUser);

router.post('/', createUser);

router.delete('/:id', deleteUser);

module.exports = router;