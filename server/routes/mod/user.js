const express = require('express');
const { getUser, updateUser, createUser, deleteUser } = require('../../controllers/mod/user');
const { checkPrivilege } = require('../../middlewares/privileges');

const router = express.Router();

router.get('/:id', getUser);

router.put('/', updateUser);

router.post('/', checkPrivilege(['createUser']), createUser);

router.delete('/:id',checkPrivilege(['createUser']), deleteUser);

module.exports = router;