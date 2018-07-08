const express = require('express');
const _ = require('lodash');
const { Account, validate } = require('../models/account');
const validateMiddleware = require('../middleware/validate');
const validateObjectIdMiddleware = require('../middleware/validateObjectId');
const router = express.Router();

router.get('/', async (req, res) => {
    let query   = {};
    let options = {
        select: req.query.select || undefined,
        sort: { name: 'asc' },
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
        
    const data = await Account.paginate(query, options);
    res.send(data);
});

router.post('/', [validateMiddleware(validate)], async (req, res) => {
    let account = new Account(_.pick(req.body, ['name']));
    account = await account.save();
    res.send(account);
});

router.put('/:id', [validateObjectIdMiddleware, validateMiddleware(validate)], async (req, res) => {
    const account = await Account.findByIdAndUpdate(
        req.params.id, 
        _.pick(req.body, ['name']),
        { new: true }
    );
    
    if (!account) {
        return res.status(404).send({
            message: 'The account with the given ID was not found.'
        });
    }

    res.send(account);
});
  
router.delete('/:id', validateObjectIdMiddleware, async (req, res) => {
    const account = await Account.findByIdAndRemove(req.params.id);
    if (!account) {
        return res.status(404).send({
            message: 'The account with the given ID was not found.'
        });
    }
  
    res.send(account);
});
  
router.get('/:id', validateObjectIdMiddleware, async (req, res) => {
    const account = await Account.findById(req.params.id);
    if (!account) {
        return res.status(404).send({
            message: 'The account with the given ID was not found.'
        });
    }
  
    res.send(account);
});

module.exports = router;
