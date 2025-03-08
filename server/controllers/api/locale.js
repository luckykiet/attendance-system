const utils = require("../../utils");

const getTranslation = async (req, res, next) => {
    try {
        const lang = req.params.lang;
        const translations = await utils.getTranslations(lang);
        return res.status(200).json({
            success: true,
            msg: translations,
        });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_translations_not_found', 500));
    }
};

module.exports = {
    getTranslation,
};