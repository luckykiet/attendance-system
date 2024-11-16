const express = require('express');
const { getEmployee, updateEmployee, createEmployee, deleteEmployee, getEmployeeWorkingAt, employeeRegistration } = require('../../controllers/mod/employee');

const router = express.Router();

router.get('/:id', getEmployee);
router.get('/working-at/:id', getEmployeeWorkingAt);

router.put('/', updateEmployee);

router.post('/', createEmployee);

router.delete('/:id', deleteEmployee);

router.post('/registration', employeeRegistration);
router.post('/registration/send', (req, res, next) => {
    req.action = 'sendEmployeeDeviceRegistration';
    next();
}, employeeRegistration);

module.exports = router;