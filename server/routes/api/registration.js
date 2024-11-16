const express = require('express')
const router = express.Router()
const { getRegistration, submitRegistration } = require('../../controllers/api/registration')

router.get('/:tokenId', getRegistration);
router.post('/', submitRegistration);

module.exports = router