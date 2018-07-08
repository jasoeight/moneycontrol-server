/**
 * automatically wraps all router functions and directs all expection to 
 * our defined error middleware. So it is not necessary to catch all possible
 * errors in each route and to keep the code cleaner
 */
require('express-async-errors');

const winston = require('winston');
const config = require('config');
const path = require('path');
const _ = require('lodash');

module.exports = function() {
    let logger;

    const format = winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      );

    if (process.env.NODE_ENV !== 'production') {
        logger = new winston.transports.Console({
            colorize: true,
            prettyPrint: true,
            handleExceptions: true,
            level: 'debug',
            format
        });
    } else {
        let logPath = config.get('logger.path')
        if (_.isEmpty(logPath)) {
            logPath = path.join(__dirname, '../application.log');
        }
        logger = new winston.transports.File({
            filename: logPath,
            handleExceptions: true,
            level: config.get('logger.level'),
            format
        });
    }
    
    winston.add(logger);
    
    process.on('uncaughtException', ex => { throw ex; });
    process.on('unhandledRejection', ex => { throw ex; });
};
