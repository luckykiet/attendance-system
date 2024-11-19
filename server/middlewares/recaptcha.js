const { CONFIG } = require('../configs')
const axios = require('axios')
const HttpError = require('../constants/http-error')

const checkReCaptcha = async (req, res, next) => {
    try {
        if (!CONFIG.isUsingRecaptcha) {
            return next()
        }
        const recaptcha = req.headers['recaptcha']
        const action = req.headers['action']

        if (!recaptcha) {
            return next(new HttpError('srv_invalid_recaptcha_request', 400))
        }

        if (!action) {
            return next(new HttpError('srv_invalid_action_request', 400))
        }

        try {
            const recaptchaResponse = await axios.post(
                `https://www.google.com/recaptcha/api/siteverify?secret=${CONFIG.grecaptchaSecret}&response=${recaptcha}`
            )
            if (
                !recaptchaResponse.data.success ||
                recaptchaResponse.data.score < 0.5 ||
                recaptchaResponse.data.action !== action
            ) {
                return next(new HttpError('srv_invalid_recaptcha', 400))
            }
        } catch (error) {
            console.log(error)
            return next(new HttpError('srv_invalid_recaptcha', 400))
        }

        next()
    } catch (error) {
        console.log(error)
        return next(new HttpError('srv_error', 500))
    }
}
module.exports = { checkReCaptcha }
