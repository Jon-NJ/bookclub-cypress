var localStore = {};

module.exports.get = (token) => { return cy.task('get', token); };
module.exports.remove = (token) => { return cy.task('remove', token); };
module.exports.reset = () => { return cy.task('reset'); };
module.exports.store = (token, value) => { return cy.task('store', { token: token, value: value }); };

module.exports.tasks = (on, config) => {
    on('task', {
        get: (token) => {
            return new Promise((resolve, reject) => {
                return resolve(localStore[token]);
            });
        },
        remove: (token) => {
            if (token in localStore) {
                delete localStore[token];
            }
            return null;
        },
        reset: () => {
            localStore = {};
            return null;
        },
        store: ({ token, value }) => {
            return new Promise((resolve, reject) => {
                localStore[token] = value;
                return resolve(value);
            });
        }
    })
}
