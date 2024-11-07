const HttpError = require('../constants/http-error')
const axios = require('axios')

const checkIpAddress = async (req, res, next) => {
    try {
        const response = await axios.get('http://httpbin.org/ip')
        return res.status(200).json({ success: true, msg: response.data.origin })
    } catch (error) {
        next(new HttpError(error instanceof Error ? error.message : 'srv_failed_to_get_ip_address', 500))
    }
}

module.exports = {
    checkIpAddress
}