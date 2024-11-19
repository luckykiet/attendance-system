
const express = require('express')
const router = express.Router()

const HttpError = require('../../constants/http-error')
const utils = require('../../utils')

router.get('/:tin', async (req, res, next) => {
    const { tin } = req.params
    const result = await utils.fetchAresWithTin(tin)

    if (!result || !result.success) {
        return next(new HttpError(result.msg || 'srv_invalid_tin', 400))
    }

    return res.status(200).json({ success: true, msg: result.msg })
})

module.exports = router