const winston = require('winston');
const mongoose = require('mongoose');
const config = require('config');
const _ = require('lodash');

module.exports = function() {
    /* connect to mongodb */
    const connection = `${config.get('mongo.db')}${config.get('mongo.collection')}`;
    const options = _.cloneDeep(config.get('mongo.options'));

    /* remove auth options if empty */
    if (_.isEmpty(options.auth.user) || _.isEmpty(options.auth.password)) {
        delete options.auth;
    }

    mongoose.connection.on('connected', () => {     
        winston.info(`Connected to MongoDB: ${connection}`);
    });
    
    mongoose.connection.on('reconnected', () => {
        winston.info(`Connection Reestablished: ${connection}`);
    });
    
    mongoose.connection.on('disconnected', () => {
        winston.info(`Connection Disconnected: ${connection}`);
    });
    
    mongoose.connection.on('close', () => {
        winston.info(`Connection Closed: ${connection}`);
    });
    
    mongoose.connection.on('error', (error) => {
        winston.error(`Connection Error: ${connection}`, error);
    });

    mongoose.connect(connection, options);
}