const express = require('express');
const { updateAttendanceById } = require('../../controllers/mod/attendance');

const router = express.Router();

router.put('/', updateAttendanceById);

module.exports = router;
