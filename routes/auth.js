const Joi = require('joi');
const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const config = require('config');
const { User } = require('../models/user');
const validateMiddleware = require('../middleware/validate');
const router = express.Router();

const tokenList = {};

router.post('/login', validateMiddleware(validate), async (req, res) => {
    let user = await User.findOne({
        where: {
            email: req.body.email,
            public: true
        }
    });

    if (!user) {
        return res.status(400).send({ message: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
        return res.status(400).send({ message: 'Invalid email or password.' });
    }

    user.token = user.generateAuthToken();
    user.refreshToken = user.generateRefreshToken();
    tokenList[user.refreshToken] = user;

    res.send(_.pick(user, ['_id', 'email', 'name', 'token', 'refreshToken']));
});

router.post('/token', async (req,res) => {
    if (!req.body.refreshToken || !(req.body.refreshToken in tokenList)) {
        return res.status(400).send({ message: 'Invalid request.' });
    }

    delete tokenList[req.body.refreshToken];
    let decoded;
    try {
        decoded = jwt.verify(req.body.refreshToken, config.get('jwt.refreshTokenSecret'));
    } catch (error) {
        return res.status(400).send({ message: 'Invalid token.' });
    }

    let user = await User.findOne({
        where: {
            _id: decoded._id,
            public: true
        }
    });

    if (!user) {
        return res.status(400).send({ message: 'Invalid token.' });
    }

    user.token = user.generateAuthToken();
    user.refreshToken = user.generateRefreshToken();
    tokenList[user.refreshToken] = user;

    res.send(_.pick(user, ['_id', 'email', 'name', 'token', 'refreshToken']));
});

function validate(user) {
    return Joi.validate(user, {
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required()
    });
}

module.exports = router;
