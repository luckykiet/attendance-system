const express = require('express')
const router = express.Router()
const registration = require('../../controllers/mod/registration')

router.post('/', registration.employeeRegistration);

module.exports = router