const Joi = require('joi');
const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const { User } = require('../models/user');
const validateMiddleware = require('../middleware/validate');
const router = express.Router();

router.post('/', validateMiddleware(validate), async (req, res) => {
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(400).send({ message: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
        return res.status(400).send({ message: 'Invalid email or password.' });
    }

    user.token = user.generateAuthToken();
    res.send(_.pick(user, ['_id', 'email', 'name', 'token']));
});

function validate(user) {
    return Joi.validate(user, {
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required()
    });
}

module.exports = router;
