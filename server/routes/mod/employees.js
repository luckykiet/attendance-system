const express = require('express');
const { getEmployees } = require('../../controllers/mod/employees');

const router = express.Router();

router.post('/', getEmployees);

module.exports = router;
