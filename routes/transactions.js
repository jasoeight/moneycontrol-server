const express = require('express');
const _ = require('lodash');
const { Transaction, validate } = require('../models/transaction');
const validateMiddleware = require('../middleware/validate');
const validateObjectIdMiddleware = require('../middleware/validateObjectId');
const router = express.Router();

const allowedFields = [
    'amount',
    'description',
    'account',
    'date',
    'owner',
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
    const transactions = await Transaction
        .find()
        .populate({
            path: 'owner', 
            select: '_id name all',
            match: { all }
        });

    return transactions.filter(({ owner }) => owner !== null);
};

router.get('/', async (req, res) => {
    let query   = {};
    let options = {
        select: req.query.select || undefined,
        sort: { date: 'desc' },
        lean: true,
        page: req.query.page ? parseInt(req.query.page, 10) : 1
    };

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : -1;
    if (limit > 0) {
        options.limit = limit;
    }

    if (req.query.sortBy) {
        options.sort = {};
        options.sort[req.query.sortBy] = req.query.sortDir || 'asc';
    }

    if (req.query.noPopulate !== '1') {
        options.populate = [
            {
                path: 'account', 
                select: 'name' 
            },
            { 
                path: 'owner', 
                select: 'name email' 
            }
        ]
    }

    if (req.query.account) {
        query.account = req.query.account;
    }

    if (req.query.owner) {
        query.owner = req.query.owner;
    }
        
    const data = await Transaction.paginate(query, options);
    res.send(data);
});

router.get('/tags', async (req, res) => {
    const transactions = await Transaction
        .findAllTags();
    
    res.send(transactions);
});

router.get('/stats/account', async (req, res) => {
    const transactions = await Transaction.find().populate('account', '_id name');
    res.send(getStatistic(transactions, 'account'));
});

router.get('/stats/owner', async (req, res) => {
    const transactionsOwners = await getTransactionsByOwnerAll(false);
    const transactionsAll = await getTransactionsByOwnerAll(true);
    let stats = getStatistic(transactionsOwners, 'owner');
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
    transaction = new Transaction(_.pick(req.body, allowedFields));
    transaction = await transaction.save();
    res.send(transaction);
});

router.put('/:id', [validateObjectIdMiddleware, validateMiddleware(validate)], async (req, res) => {
    const transaction = await Transaction.findByIdAndUpdate(
        req.params.id, 
        _.pick(req.body, allowedFields),
        { new: true }
    );
    
    if (!transaction) {
        return res.status(404).send({
            message: 'The transaction with the given ID was not found.'
        });
    }

    res.send(transaction);
});
  
router.delete('/:id', validateObjectIdMiddleware, async (req, res) => {
    const transaction = await Transaction.findByIdAndRemove(req.params.id);
    if (!transaction) {
        return res.status(404).send({
            message: 'The transaction with the given ID was not found.'
        });
    }
  
    res.send(transaction);
});
  
router.get('/:id', validateObjectIdMiddleware, async (req, res) => {
    const transaction = await Transaction
        .findById(req.params.id)
        .populate({ 
            path: 'account', 
            select: 'name' 
        })
        .populate({ 
            path: 'owner', 
            select: 'name email' 
        });

    if (!transaction) {
        return res.status(404).send({
            message: 'The transaction with the given ID was not found.'
        });
    }
  
    res.send(transaction);
});

module.exports = router;
