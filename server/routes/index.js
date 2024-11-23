const express = require('express');
const utils = require('../utils');
const { CONFIG } = require('../configs');

const router = express.Router();

router.get('/redirect', async (req, res, next) => {
    try {
        const { tokenId } = req.query;
        const host = CONFIG.host;
        const appLink = `${CONFIG.mobile_intent}registration?tokenId=${tokenId}&domain=${host}`;
        res.redirect(appLink);
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_bad_request', 400));
    }
});

module.exports = router;
