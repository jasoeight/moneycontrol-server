const config = require('config'); // config module

module.exports = function() {
    /* check required configuration */
    if (!config.get('jwt.privateKey')) {
        throw new Error('FATAL ERROR: jwt.privateKey is not defined.');
    }
};
