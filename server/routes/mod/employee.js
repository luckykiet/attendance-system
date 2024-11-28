const express = require('express');
const { getEmployee, updateEmployee, createEmployee, deleteEmployee, getEmployeeWorkingAt, employeeRegistration } = require('../../controllers/mod/employee');
const { checkPrivilege } = require('../../middlewares/privileges');

const router = express.Router();

router.get('/:id', getEmployee);
router.get('/working-at/:id', getEmployeeWorkingAt);

router.put('/', checkPrivilege(['editEmployee']), updateEmployee);

router.post('/', checkPrivilege(['addEmployee']), createEmployee);

router.delete('/:id', checkPrivilege(['addEmployee']), deleteEmployee);

router.post('/registration', checkPrivilege(['employeeRegistration']), employeeRegistration);
router.post('/registration/send', checkPrivilege(['employeeRegistration']), (req, res, next) => {
    req.action = 'sendEmployeeDeviceRegistration';
    next();
}, employeeRegistration);

module.exports = router;