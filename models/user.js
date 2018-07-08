const Joi = require('joi');
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const jwt = require('jsonwebtoken');
const config = require('config');

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        minlength: 5,
        maxlength: 255
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1024
    },
    all: {
        type: Boolean,
        default: false
    }
});

schema.plugin(mongoosePaginate);

schema.methods.generateAuthToken = function() {
    return jwt.sign(
        { 
            _id: this._id 
        },
        config.get('jwt.privateKey'),
        {
            expiresIn: config.get('jwt.expiresIn')
        }
    );
};

const User = mongoose.model('User', schema);

function validate(user, create = true) {
    let options = {
        name: Joi.string().min(5).max(50).required().label('Name'),
        email: Joi.string().min(5).max(255).required().email().label('Email'),
        all: Joi.boolean().default(false).label('All'),
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
