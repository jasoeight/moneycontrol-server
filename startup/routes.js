/* external modules */
const express = require('express');
const cors = require('cors');

/* routes */
const accounts = require('../routes/accounts');
const users = require('../routes/users');
const transactions = require('../routes/transactions');
const auth = require('../routes/auth');

/* middlewares */
const authMiddleware = require('../middleware/auth');
const errorMiddleware = require('../middleware/error');

module.exports = function(app) {
    /* configure app */
    app.use(express.json());
    app.use(cors());
    app.use('/api/accounts', authMiddleware, accounts);
    app.use('/api/users', authMiddleware, users);
    app.use('/api/transactions', authMiddleware, transactions);
    app.use('/api/auth', auth);
    app.use(errorMiddleware);
};
