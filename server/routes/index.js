const express = require('express');
const utils = require('../utils');
const HttpError = require('../constants/http-error');
const Registration = require('../models/Registration');
const { CONFIG } = require('../configs');

const router = express.Router();

router.get('/redirect', async (req, res, next) => {
    try {
        const { tokenId } = req.query;
        const registration = await Registration.findOne({ tokenId });

        if (!registration) {
            throw new HttpError('srv_registration_not_found', 404);
        }

        const host = CONFIG.host;
        const appLink = `${CONFIG.mobile_intent}registration?tokenId=${tokenId}&domain=${host}`;
        res.json(appLink);
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_bad_request', 400));
    }
});

module.exports = router;
