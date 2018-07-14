const Joi = require('joi');
const Sequelize = require('sequelize');
const db = require('./db');

const Account = db.define('accounts', {
    _id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    }
}, {
    timestamps: false
});

function validate(account) {
    return Joi.validate(account, {
        name: Joi.string().required().label('Name')
    });
}

module.exports.Account = Account;
module.exports.validate = validate;
