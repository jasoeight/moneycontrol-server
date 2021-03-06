const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).send({
            message: 'Access denied. No token provided.'
        });
    }

    try {
        const decoded = jwt.verify(token, config.get('jwt.tokenSecret'));
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).send({ message: 'Token expired.'});
        }

        res.status(400).send({ message: 'Invalid token.' });
    }
};
