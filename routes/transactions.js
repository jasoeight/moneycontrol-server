const express = require('express');
const _ = require('lodash');
const { Transaction, validate } = require('../models/transaction');
const { Account } = require('../models/account');
const { User } = require('../models/user');
const validateMiddleware = require('../middleware/validate');
const router = express.Router();

const allowedFields = [
    'amount',
    'description',
    'accountId',
    'date',
    'userId',
    'tags',
    'type'
];

const getStatistic = (transactions, ref) => {
    let stats = {};
    transactions.forEach(transaction => {
        if (!stats[transaction[ref]._id]) {
            stats[transaction[ref]._id] = {
                amount: 0,
                [ref]: transaction[ref]
            };
        }

        if (transaction.type === 'income') {
            stats[transaction[ref]._id].amount += transaction.amount;
        } else {
            stats[transaction[ref]._id].amount -= transaction.amount;
        }
    });
    return stats;
}

const getTransactionsByOwnerAll = async all => {
    return await Transaction.findAll({
        include: [{
            model: User,
            attributes: ['_id', 'name', 'email'],
            where: { all }
        }]
    });
};

router.get('/', async (req, res) => {
    let options = {
        order: [['date', 'DESC']]
    };

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : -1;
    if (limit > 0) {
        options.limit = limit;
        if (req.query.page) {
            options.offset = (parseInt(req.query.page, 10) - 1) * limit;
        }
    }

    if (req.query.sortBy) {
        const direction = (req.query.sortDir || 'asc').toUpperCase();
        options.order = [];
        switch (req.query.sortBy) {
            case 'account':
                options.order.push([Account, 'name', direction]);
                break;
            case 'user':
                options.order.push([User, 'name', direction]);
                break;
            default:
                options.order.push([req.query.sortBy, direction]);
        }
    }

    options.include = [];
    let accountsInclude = { model: Account };
    let usersInclude = {
        model: User,
        attributes: ['_id', 'name', 'email', 'all']
    };

    if (req.query.account || req.query.noPopulate !== '1') {
        if (req.query.account) {
            accountsInclude.where = { _id: req.query.account };
        }
        options.include.push(accountsInclude);
    }

    if (req.query.user || req.query.noPopulate !== '1') {
        if (req.query.user) {
            usersInclude.where = { _id: req.query.user };
        }
        options.include.push(usersInclude);
    }
    
    const data = await Transaction.findAndCountAll(options);
    res.send(data);
});

router.get('/tags', async (req, res) => {
    const transactions = await Transaction
        .findAllTags();
    
    res.send(transactions);
});

router.get('/stats/account', async (req, res) => {
    const transactions = await Transaction.findAll({
        include: [ Account ]
    });
    res.send(getStatistic(transactions, 'account'));
});

router.get('/stats/user', async (req, res) => {
    const transactionsOwners = await getTransactionsByOwnerAll(false);
    const transactionsAll = await getTransactionsByOwnerAll(true);
    let stats = getStatistic(transactionsOwners, 'user');
    const statsKeys = Object.keys(stats);
    transactionsAll.forEach(transaction => {
        const personAmount = transaction.amount / statsKeys.length;
        statsKeys.forEach(statsKey => {
            if (transaction.type === 'income') {
                stats[statsKey].amount += personAmount;
            } else {
                stats[statsKey].amount -= personAmount;
            }
        });
    });
    res.send(stats);
});

router.post('/', [validateMiddleware(validate)], async (req, res) => {
    const transaction = await Transaction.create(_.pick(req.body, allowedFields));
    res.send(transaction);
});

router.put('/:id', [validateMiddleware(validate)], async (req, res) => {
    const params = _.pick(req.body, allowedFields);
    const [ rows ] = await Transaction.update(params, {
        where: { _id: req.params.id }
    });

    if (rows === 0) {
        return res.status(404).send({ message: 'The transcation with the given ID was not found.' });
    }

    res.send({ success: true });
});
  
router.delete('/:id', async (req, res) => {
    const count = await Transaction.destroy({ where: { _id: req.params.id } });
    if (count === 0) {
        return res.status(404).send({ message: 'The transaction with the given ID was not found.' });
    }
  
    res.send({ success: true });
});
  
router.get('/:id', async (req, res) => {
    let options = {
        where: { _id: req.params.id }
    };

    
    if (req.query.noPopulate !== '1') {
        options.include = [
            Account,
            {
                model: User,
                attributes: ['_id', 'name', 'email', 'all']
            }
        ];
    }
    
    const transaction = await await Transaction.findOne(options);
    if (!transaction) {
        return res.status(404).send({ message: 'The transaction with the given ID was not found.' });
    }
  
    res.send(transaction);
});

module.exports = router;
