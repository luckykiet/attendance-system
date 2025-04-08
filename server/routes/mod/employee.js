const express = require('express');
const { getEmployee, updateEmployee, createEmployee, deleteEmployee, getEmployeeWorkingAt, employeeRegistration, cancelDevicePairing } = require('../../controllers/mod/employee');
const { privileges, recaptcha } = require('../../middlewares');

const router = express.Router();

router.get('/:id', getEmployee);
router.get('/working-at/:id', getEmployeeWorkingAt);

router.put('/', recaptcha.checkReCaptcha, privileges.checkPrivilege(['editEmployee']), updateEmployee);
router.put('/cancel-pairing/:id', cancelDevicePairing);

router.post('/', recaptcha.checkReCaptcha, privileges.checkPrivilege(['addEmployee']), createEmployee);

router.delete('/:id', privileges.checkPrivilege(['addEmployee']), deleteEmployee);

router.post('/registration', recaptcha.checkReCaptcha, privileges.checkPrivilege(['employeeRegistration']), employeeRegistration);
router.post('/registration/send', recaptcha.checkReCaptcha, privileges.checkPrivilege(['employeeRegistration']), (req, res, next) => {
    req.action = 'sendEmployeeDeviceRegistration';
    next();
}, employeeRegistration);

module.exports = router;