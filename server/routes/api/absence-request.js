const express = require('express')
const { createAbsenceRequest } = require('../../controllers/api/absence-request')
const router = express.Router()

router.post('/', createAbsenceRequest);

module.exports = router
