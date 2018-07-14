const Joi = require('joi');
const Sequelize = require('sequelize');
const db = require('./db');
const _ = require('lodash');
const { Account } = require('./account');
const { User } = require('./user');

const Transaction = db.define('transactions', {
    _id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    amount: {
        type: Sequelize.DOUBLE.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        validate: { 
            min: 0,
            isDecimal: true
        }
    },
    description: {
        type: Sequelize.STRING,
        allowNull: false,
        set(val) {
            this.setDataValue('description', val.trim());
        }
    },
    date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
    tags: {
        type: Sequelize.STRING,
        get() {
            return this.getDataValue('tags').split(',');
        },
        set(val) {
            this.setDataValue('tags', val.join(','));
        }
    },
    type: {
        type: Sequelize.ENUM('income', 'expense'),
        defaultValue: 'expense'
    }
}, {
    timestamps: false
});

Transaction.belongsTo(User);
Transaction.belongsTo(Account);

Transaction.findAllTags = function() {
    return this.findAll({ attributes: ['tags'] })
        .then(items => {
            let tags = [];
            items.forEach(tansaction => {
                tags = _.concat(tags, tansaction.tags);
            });

            return _.uniq(tags).sort();
        });
};

function validate(transaction) {
    return Joi.validate(transaction, {
        amount: Joi.number().required().min(0).precision(2).label('Amount'),
        description: Joi.string().required().label('Description'),
        accountId: Joi.number().required().label('Account'),
        userId: Joi.number().required().label('Owner'),
        date: Joi.date().label('Date'),
        tags: Joi.array().items(
            Joi.string()
        ),
        type: Joi.string().required().lowercase().options({
            convert: true
        }).valid('income', 'expense').label('Type')
    });
};

module.exports.Transaction = Transaction;
module.exports.validate = validate;
