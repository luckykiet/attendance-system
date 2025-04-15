const express = require('express')
const router = express.Router()
const { getAttendances, getAttendancesByRetail } = require('../../controllers/api/attendances')

router.get('/', getAttendances);
router.get('/:retailId', getAttendancesByRetail);

module.exports = router
