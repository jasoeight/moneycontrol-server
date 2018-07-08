const Joi = require('joi');
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const _ = require('lodash');

let schema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    account: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Account'
    },
    date: { 
        type: Date,
        default: Date.now
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    tags: [ String ],
    type: {
        type: String,
        default: 'expense',
        lowercase: true,
        enum: ['income', 'expense']
    }
});

schema.plugin(mongoosePaginate);

schema.statics.findAllTags = function() {
    return this.find().select('tags')
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
        account: Joi.objectId().required().label('Account'),
        owner: Joi.objectId().required().label('Owner'),
        date: Joi.date().label('Date'),
        tags: Joi.array().items(
            Joi.string()
        ),
        type: Joi.string().required().lowercase().options({
            convert: true
        }).valid('income', 'expense').label('Type')
    });
};

module.exports.Transaction = mongoose.model('Transaction', schema);
module.exports.validate = validate;
