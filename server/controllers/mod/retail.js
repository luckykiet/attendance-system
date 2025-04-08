const HttpError = require('../../constants/http-error');
const Retail = require('../../models/Retail');
const utils = require('../../utils');

const getRetailById = async (id) => {
    if (!id) {
        return null;
    }
    return await Retail.findById(id);
};

const getRetail = async (req, res, next) => {
    try {
        const retail = await getRetailById(req.user.retailId);
        if (!retail) {
            throw new HttpError('srv_retail_not_found', 404);
        }
        return res.status(200).json({ success: true, msg: retail });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_retail_not_found', 404));
    }
};

const updateRetail = async (req, res, next) => {
    try {
        //Dont update the tin
        delete req.body.tin;
        const updatedRetail = await Retail.findOneAndUpdate(
            { _id: req.user.retailId },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!updatedRetail) {
            throw new HttpError('srv_retail_not_found', 404);
        }
        return res.status(200).json({ success: true, msg: updatedRetail });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_retail_update_failed', 400));
    }
};

module.exports = {
    getRetail,
    updateRetail,
};
