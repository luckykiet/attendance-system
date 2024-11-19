const express = require('express')
const router = express.Router()
const { getAttendances } = require('../../controllers/api/attendances')

router.get('/', getAttendances);

module.exports = router
