const express = require('express')
const router = express.Router()
const { makeAttendance } = require('../../controllers/api/attendance')

router.post('/', makeAttendance);

module.exports = router
