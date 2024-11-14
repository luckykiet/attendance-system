const express = require('express')
const router = express.Router()
const { getNearbyCompanies } = require('../../controllers/api/nearby-companies')

router.post('/', getNearbyCompanies);

module.exports = router
