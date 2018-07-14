const Joi = require('joi');
const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const router = express.Router();

router.get('/', (req, res) => {
    res.send({ success: true });
});

module.exports = router;
