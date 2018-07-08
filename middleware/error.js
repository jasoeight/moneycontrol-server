const winston = require('winston');

module.exports = function(error, req, res, next) {
    winston.error(error.message, error);
    let statusCode = 500;
    let message = error.message;

    if (error.name === 'MongoError' && error.code === 11000) {
        statusCode = 404;
        message = 'Duplicated entry';
    }

    return res.status(statusCode).send({
        message,
        error
    });
};
