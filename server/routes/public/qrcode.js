const express = require('express');
const QRCode = require('qrcode');
const router = express.Router();

const respondWithDataURL = (res, data) => {
    res.setHeader('Content-type', 'image/x-png');
    const buffer = typeof data === 'string' ? Buffer.from(data.replace('data:image/png;base64,', ''), 'base64') : data;
    res.send(buffer);
};

router.get('/:text', async (req, res) => {
    const decodedText = decodeURIComponent(req.params.text);
    const dataURL = await QRCode.toDataURL(decodedText, { margin: 1, width: 512 });
    respondWithDataURL(res, dataURL);
});

router.get('/', async (req, res) => {
    const decodedText = decodeURIComponent(req.query.text);
    const dataURL = await QRCode.toDataURL(decodedText, { margin: 1, width: 512 });
    respondWithDataURL(res, dataURL);
});

module.exports = router;