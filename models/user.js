const Joi = require('joi');
const Sequelize = require('sequelize');
const db = require('./db');
const jwt = require('jsonwebtoken');
const config = require('config');
const _ = require('lodash');

const User = db.define('users', {
    _id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        set(val) {
            this.setDataValue('name', val.trim());
        }
    },
    email: {
        type: Sequelize.STRING,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    all: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
}, {
    validate: {
        requiredEmailForPublicUsers() {
            if (this.public === true && _.isEmpty(this.email)) {
                throw new Error('Required email for public users.');
            }
        }
    },
    timestamps: false
});

User.prototype.generateAuthToken = function() {
    return jwt.sign(
        { _id: this._id },
        config.get('jwt.tokenSecret'),
        { expiresIn: config.get('jwt.tokenExpiresIn') }
    );
};

User.prototype.generateRefreshToken = function() {
    return jwt.sign(
        { _id: this._id },
        config.get('jwt.refreshTokenSecret'),
        { expiresIn: config.get('jwt.refreshTokenExpiresIn') }
    );
};

function validate(user, create = true) {
    let options = {
        name: Joi.string().min(5).max(50).required().label('Name'),
        email: Joi.string().min(5).max(255).email().label('Email'),
        all: Joi.boolean().default(false).label('All'),
        public: Joi.boolean().default(false).label('Public'),
        password: Joi.string().min(5).max(255).allow('').optional().label('Password')
    }

    if (create) {
        options['password'] = Joi.string().min(5).max(255).required().label('Password');
    }

    return Joi.validate(user, options);
};

function validateExisting(user) {
    return validate(user, false);
};

module.exports.User = User;
module.exports.validate = validate;
module.exports.validateExisting = validateExisting;
