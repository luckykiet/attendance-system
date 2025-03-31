const express = require('express')
const { getAbsenceRequests } = require('../../controllers/api/absence-requests')
const router = express.Router()

router.post('/', getAbsenceRequests);

module.exports = router
