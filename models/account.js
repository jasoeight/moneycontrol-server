const Joi = require('joi');
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: 'Name is required',
        unique: true,
        trim: true
    }
});

schema.plugin(mongoosePaginate);

const Account = mongoose.model('Account', schema);

function validate(account) {
    return Joi.validate(account, {
        name: Joi.string().required().label('Name')
    });
}

module.exports.Account = Account;
module.exports.validate = validate;
