const express = require('express');
const _ = require('lodash');
const { Account, validate } = require('../models/account');
const validateMiddleware = require('../middleware/validate');
const router = express.Router();

router.get('/', async (req, res) => {
    let options = {
        order: [['name', 'ASC']]
    };

    if (req.query.select) {
        options.attributes = req.query.select.split(',');
    }

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : -1;
    if (limit > 0) {
        options.limit = limit;
        if (req.query.page) {
            options.offset = (parseInt(req.query.page, 10) - 1) * limit;
        }
    }

    if (req.query.sortBy) {
        options.order = [
            [req.query.sortBy, (req.query.sortDir || 'asc').toUpperCase()]
        ];
    }
        
    const data = await Account.findAndCountAll(options);
    res.send(data);
});

router.post('/', [validateMiddleware(validate)], async (req, res) => {
    const account = await Account.create(_.pick(req.body, ['name']));
    res.send(account);
});

router.put('/:id', [validateMiddleware(validate)], async (req, res) => {
    const params = _.pick(req.body, ['name']);
    const [ rows ] = await Account.update(params, {
        where: { _id: req.params.id }
    });

    if (rows === 0) {
        return res.status(404).send({ message: 'The account with the given ID was not found.' });
    }

    res.send({ success: true });
});
  
router.delete('/:id', async (req, res) => {
    const count = await Account.destroy({ where: { _id: req.params.id } });
    if (count === 0) {
        return res.status(404).send({ message: 'The account with the given ID was not found.' });
    }
  
    res.send({ success: true });
});
  
router.get('/:id', async (req, res) => {
    const account = await await Account.findOne({
        where: { _id: req.params.id }
    });
    if (!account) {
        return res.status(404).send({ message: 'The account with the given ID was not found.' });
    }
  
    res.send(account);
});

module.exports = router;
