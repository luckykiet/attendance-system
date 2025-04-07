const express = require('express')
const router = express.Router()
const { makeAttendance } = require('../../controllers/api/attendance')
const { ensureTokenVerified } = require('../../middlewares/auth');

router.post('/', ensureTokenVerified, makeAttendance);

module.exports = router
