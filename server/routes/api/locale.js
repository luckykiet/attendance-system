const express = require('express')
const { getTranslation } = require('../../controllers/api/locale')
const router = express.Router()

router.get('/:lang', getTranslation)

module.exports = router