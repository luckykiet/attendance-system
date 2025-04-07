const express = require('express')
const { createAbsenceRequest } = require('../../controllers/api/absence-request');
const { ensureTokenVerified } = require('../../middlewares/auth');
const router = express.Router()

router.post('/', ensureTokenVerified, createAbsenceRequest);

module.exports = router
