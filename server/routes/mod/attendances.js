const express = require('express');
const { getAttendancesByRegisterAndDate } = require('../../controllers/mod/attendances');

const router = express.Router();

router.post('/register', getAttendancesByRegisterAndDate);

module.exports = router;
