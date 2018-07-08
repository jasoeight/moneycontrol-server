const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const { User, validate, validateExisting } = require('../models/user');
const validateMiddleware = require('../middleware/validate');
const validateObjectIdMiddleware = require('../middleware/validateObjectId');
const router = express.Router();

router.get('/', async (req, res) => {
    let query   = {};
    let options = {
        select: req.query.select || 'name email _id all',
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
        
    const data = await User.paginate(query, options);
    res.send(data);
});

router.post('/', validateMiddleware(validate), async (req, res) => {
    const user = new User(_.pick(req.body, ['name', 'email', 'password', 'all']));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
    res.send(_.pick(user, ['_id', 'name', 'email', 'all']));
});

router.get('/me', async(req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.send(user);
});

router.put('/:id', [validateObjectIdMiddleware, validateMiddleware(validateExisting)], async (req, res) => {
    let params = _.pick(req.body, ['name', 'email', 'password', 'all']);

    if (_.isEmpty(params.password)) {
        delete params.password;
    }

    if (params.password) {
        const salt = await bcrypt.genSalt(10);
        params.password = await bcrypt.hash(params.password, salt);
    }

    const user = await User.findByIdAndUpdate(
        req.params.id, 
        params,
        { new: true }
    );
    
    if (!user) {
        return res.status(404).send({ message: 'The user with the given ID was not found.' });
    }

    res.send(user);
});
  
router.delete('/:id', validateObjectIdMiddleware, async (req, res) => {
    const user = await User.findByIdAndRemove(req.params.id);
  
    if (!user) {
        return res.status(404).send({ message: 'The user with the given ID was not found.' });
    }
  
    res.send(user);
});
  
router.get('/:id', validateObjectIdMiddleware, async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).send({ message: 'The user with the given ID was not found.' });
    }
  
    res.send(user);
});

module.exports = router;
