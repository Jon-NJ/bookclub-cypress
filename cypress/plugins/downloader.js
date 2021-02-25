const fs = require('fs');
const path = require('path');

function get_size(filename) {
    let stat = fs.statSync(filename);
    return stat.size;

    // return new Promise((resolve, reject) => {
    //     return resolve(stat.size);
    // });
}

module.exports.delete = (filename) => { return cy.task('downloader:delete', filename); };
module.exports.get_size = (filename) => { return cy.task('downloader:get_size', filename); };
module.exports.fetch = (href, filename) => {
    return cy.downloadFile(href, path.dirname(filename), path.basename(filename));
};

module.exports.tasks = (on, config) => {
    on('task', {
        'downloader:delete': (filename, config) => {
            fs.unlink('/tmp/invitation.ical', () => { });
            return null;
        },
        'downloader:get_size': (filename, config) => {
            // return new Promise((resolve, reject) => {
            //     return resolve(get_size(filename));
            // });
            return get_size(filename);
        }
    })
}
