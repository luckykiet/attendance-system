const { CONFIG } = require("../../configs");
const utils = require("../../utils");

const getAdminAppConfig = async (req, res, next) => {
    try {
        const domain = req.hostname.split('.').slice(-2).join('.');
        return res.status(200).json({
            success: true,
            msg: {
                appName: CONFIG.appName,
                companyName: CONFIG.companyName,

                // Server configuration
                proxyUrl: CONFIG.proxyUrl,

                // Intent
                mobileIntent: CONFIG.mobileIntent,

                // Google reCAPTCHA configuration
                grecaptchaSiteKey: utils.getGrecaptchaSiteKey(domain),

                // Google Maps API configuration
                googleMapsApiKey: utils.getGoogleMapsApiKey(domain),
            }
        });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_config_not_found', 500));
    }
};

module.exports = {
    getAdminAppConfig,
}
