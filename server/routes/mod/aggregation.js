const express = require('express')
const router = express.Router()
const { getAttendanceAggregationRegisterAndByRange, getAttendanceAggregationEmployeeAndByRange } = require('../../controllers/mod/aggregation')

router.get('/register/:registerId', getAttendanceAggregationRegisterAndByRange);
router.get('/employee/:employeeId', getAttendanceAggregationEmployeeAndByRange);

module.exports = router
