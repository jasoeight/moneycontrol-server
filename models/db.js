const Sequelize = require('sequelize');
const config = require('config');

const db = new Sequelize(config.get('db.name'), config.get('db.username'), config.get('db.password'), {
    host: config.get('db.host'),
    dialect: 'mysql'
});

module.exports = db;
