/* external modules */
const express = require('express');
const winston = require('winston');
const config = require('config');

/* init app */
const app = express();
require('./startup/logging')();
require('./startup/config')();
require('./startup/prod')(app);
require('./startup/routes')(app);

/* start app and server */
/*
if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || config.get('server.port');
    app.listen(port, () => winston.info(`Listening on port ${port}...`));
}
*/

module.exports  = app;
