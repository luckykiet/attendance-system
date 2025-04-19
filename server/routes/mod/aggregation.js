const express = require('express')
const router = express.Router()
const { getAttendanceAggregationRegisterAndByRange } = require('../../controllers/mod/aggregation')

router.post('/', getAttendanceAggregationRegisterAndByRange);

module.exports = router
