const bcrypt = require('bcrypt');
const { Transaction } = require('../models/transaction');
const { Account } = require('../models/account');
const { User } = require('../models/user');
const commandLineArgs = require('command-line-args')
const fs = require('fs')

class FileDetails {
    constructor (filename) {
        this.filename = filename
        this.exists = fs.existsSync(filename)
        if (this.exists) {
            const realPath = fs.realpathSync(filename);
            this.data = require(realPath);
        }
    }
};

const cli = commandLineArgs([
    { name: 'file', type: filename => new FileDetails(filename) },
    { name: 'password', type: String }
]);

if (!cli.file.exists) {
    throw new Error(`File ${filename} does not exist`);
}

if (!cli.password) {
    throw new Error(`Missing password`);
}

function importAccounts(accounts) {
    let promises = [];
    Object.keys(accounts).forEach(key => {
        promises.push(new Promise(resolve => {
            Account.create({
                name: accounts[key].name
            }).then(account => {
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
        promises.push(new Promise(resolve => {
            User.create({
                name: users[key].name,
                email: users[key].email,
                password: password,
                all: users[key].all,
                public: true
            }).then(user => {
                resolve({ key, user });
            })
        }));
    });

    return Promise.all(promises).then(data => {
        let mapping = {};
        data.forEach(({ key, user }) => {
            mapping[key] = user.get('_id');
        });
        return mapping;
    });
}

function importTransactions(transactions, accounts, users) {
    let promises = [];
    Object.keys(transactions).forEach(key => {
        promises.push(new Promise(resolve => {
            Transaction.create({
                accountId: accounts[transactions[key].account],
                userId: users[transactions[key].owner],
                amount: transactions[key].amount,
                date: transactions[key].date,
                description: transactions[key].description,
                tags: transactions[key].tags,
                type: transactions[key].type
            }).then(() => {
                resolve();
            })
        }));
    });

    return Promise.all(promises).then(data => data.length);
}

async function importData() {
    const accounts = await importAccounts(cli.file.data.accounts);
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(cli.password, salt)
    const users = await importUsers(cli.file.data.users, password);
    const countTransactions = await importTransactions(cli.file.data.transactions, accounts, users);
    console.log('Accounts', Object.keys(accounts).length);
    console.log('Users', Object.keys(users).length);
    console.log('Transactions', countTransactions);
}

importData();