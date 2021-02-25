const { downloadFile } = require('cypress-downloadfile/lib/addPlugin');

const database = require('./database');
const storage = require('./storage');
const forwarder = require('./forwarder');
const mailmonitor = require('./mailmonitor');
const downloader = require('./downloader');
const { on } = require('nodemailer/lib/mailer');

module.exports = (on, config) => {
    database.tasks(on, config);
    storage.tasks(on, config);
    forwarder.tasks(on, config);
    mailmonitor.tasks(on, config);
    downloader.tasks(on, config);
    on('task', { downloadFile });
};
