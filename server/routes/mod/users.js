const express = require('express');
const { getUsers } = require('../../controllers/mod/users');

const router = express.Router();

router.post('/', getUsers);

module.exports = router;
