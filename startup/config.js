const config = require('config'); // config module

module.exports = function() {
    /* check required configuration */
    if (!config.get('jwt.tokenSecret')) {
        throw new Error('FATAL ERROR: jwt.tokenSecret is not defined.');
    }
    if (!config.get('jwt.refreshTokenSecret')) {
        throw new Error('FATAL ERROR: jwt.refreshTokenSecret is not defined.');
    }
};
