const express = require('express');
const { getEmployee, updateEmployee, createEmployee, deleteEmployee, getEmployeeWorkingAt } = require('../../controllers/mod/employee');

const router = express.Router();

router.get('/:id', getEmployee);
router.get('/working-at/:id', getEmployeeWorkingAt);

router.put('/', updateEmployee);

router.post('/', createEmployee);

router.delete('/:id', deleteEmployee);

module.exports = router;