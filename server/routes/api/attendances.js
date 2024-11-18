const express = require('express')
const router = express.Router()
const { getAttendances } = require('../../controllers/api/attendance')

router.get('/', getAttendances);

module.exports = router
