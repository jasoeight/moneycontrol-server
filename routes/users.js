const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const { User, validate, validateExisting } = require('../models/user');
const validateMiddleware = require('../middleware/validate');
const router = express.Router();

const getAttributes = ['_id', 'name', 'email', 'all', 'public'];
const postAttributes = ['name', 'email', 'all', 'public', 'password'];

router.get('/', async (req, res) => {
    let options = {
        attributes: req.query.select ? req.query.select.split(',') : getAttributes,
        order: [['name', 'ASC']]
    };

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
        
    const data = await User.findAndCountAll(options);
    res.send(data);
});

router.post('/', validateMiddleware(validate), async (req, res) => {
    const salt = await bcrypt.genSalt(10);
    const params = _.pick(req.body, postAttributes);
    params.password = await bcrypt.hash(params.password, salt);
    const user = await User.create(params);
    res.send(_.pick(user, getAttributes));
});

router.get('/me', async(req, res) => {
    const user = await await User.findOne({
        attributes: getAttributes,
        where: { _id: req.user._id }
    });
    res.send(user);
});

router.put('/:id', [validateMiddleware(validateExisting)], async (req, res) => {
    let params = _.pick(req.body, postAttributes);
    if (_.isEmpty(params.password)) {
        delete params.password;
    }

    if (params.password) {
        const salt = await bcrypt.genSalt(10);
        params.password = await bcrypt.hash(params.password, salt);
    }

    const [ rows ] = await User.update(params, {
        where: { _id: req.params.id }
    });

    if (rows === 0) {
        return res.status(404).send({ message: 'The user with the given ID was not found.' });
    }

    res.send({ success: true });
});
  
router.delete('/:id', async (req, res) => {
    const count = await User.destroy({ where: { _id: req.params.id } });
    if (count === 0) {
        return res.status(404).send({ message: 'The user with the given ID was not found.' });
    }
  
    res.send({ success: true });
});
  
router.get('/:id', async (req, res) => {
    const user = await await User.findOne({
        attributes: getAttributes,
        where: { _id: req.params.id }
    });
    if (!user) {
        return res.status(404).send({ message: 'The user with the given ID was not found.' });
    }
  
    res.send(_.pick(user, getAttributes));
});

module.exports = router;
