const express = require('express')
const router = express.Router()
const { getMyWorkingPlaces, getTodayWorkplaces } = require('../../controllers/api/workplaces')

router.get('/', getMyWorkingPlaces);
router.post('/', getTodayWorkplaces);

module.exports = router
