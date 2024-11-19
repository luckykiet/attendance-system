const express = require('express');
const { getAttendancesByRegisterAndDate, getAttendancesByEmployeeAndDate } = require('../../controllers/mod/attendances');

const router = express.Router();

router.post('/register', getAttendancesByRegisterAndDate);
router.post('/employee', getAttendancesByEmployeeAndDate);

module.exports = router;
