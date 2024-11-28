const { PRIVILEGES } = require('../configs');
const HttpError = require('../constants/http-error');

const checkPrivilege = (permissions = []) => (req, res, next) => {
    try {
        const hasPrivilege = permissions.some((permission) => {
            return permission && PRIVILEGES[permission] && PRIVILEGES[permission].includes(req.user.role);
        });

        if (!hasPrivilege) {
            return next(new HttpError(`srv_insufficient_privileges`, 403));
        }

        next();
    } catch (error) {
        next(new HttpError(error instanceof Error ? error.message : 'srv_insufficient_privileges', 403));
    }
};

module.exports = {
    checkPrivilege
};
