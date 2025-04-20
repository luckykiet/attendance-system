const express = require('express')
const router = express.Router()
const { getAttendanceAggregationRegisterAndByRange } = require('../../controllers/mod/aggregation')

router.get('/:registerId', getAttendanceAggregationRegisterAndByRange);

module.exports = router
