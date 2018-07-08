const data = require('../resource/money-control-d2002-export.json');
const bcrypt = require('bcrypt');
const { Transaction } = require('../models/transaction');
const { Account } = require('../models/account');
const { User } = require('../models/user');
const mongoose = require('mongoose');

function importAccounts(accounts) {
    let promises = [];
    Object.keys(accounts).forEach(key => {
        let account = new Account({
            name: accounts[key].name
        });
        promises.push(new Promise(resolve => {
            account.save().then(account => {
                resolve({ key, account });
            })
        }));
    });

    return Promise.all(promises).then(data => {
        let mapping = {};
        data.forEach(({ key, account }) => {
            mapping[key] = account._id;
        });
        return mapping;
    });
}

function importUsers(users, password) {
    let promises = [];
    Object.keys(users).forEach(key => {
        let user = new User({
            name: users[key].name,
            email: users[key].email,
            password: password,
            all: users[key].all,
        });

        promises.push(new Promise(resolve => {
            user.save().then(user => {
                resolve({ key, user });
            })
        }));
    });

    return Promise.all(promises).then(data => {
        let mapping = {};
        data.forEach(({ key, user }) => {
            mapping[key] = user._id;
        });
        return mapping;
    });
}

function importTransactions(transactions, accounts, users) {
    let promises = [];
    Object.keys(transactions).forEach(key => {
        let transaction = new Transaction({
            account: accounts[transactions[key].account],
            owner: users[transactions[key].owner],
            amount: transactions[key].amount,
            date: transactions[key].date,
            description: transactions[key].description,
            tags: transactions[key].tags,
            type: transactions[key].type
        });
        promises.push(new Promise(resolve => {
            transaction.save().then(() => {
                resolve();
            })
        }));
    });

    return Promise.all(promises).then(data => {
        let count = 0;
        data.forEach(() => {
            count++;
        });
        return count;
    });
}

mongoose.connect('mongodb://localhost/money-control');
async function importData() {
    const accounts = await importAccounts(data.accounts);
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('1234567', salt)
    const users = await importUsers(data.users, password);
    const countTransactions = await importTransactions(data.transactions, accounts, users);
    console.log('Accounts', Object.keys(accounts).length);
    console.log('Users', Object.keys(users).length);
    console.log('Transactions', countTransactions);
}

importData();