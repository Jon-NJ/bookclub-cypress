const { MailListener } = require('mail-listener5');

function getListener(account, config) {
    const server = config.env.email.imap;
    return new MailListener({
        username: account.email,
        password: account.password,
        host: server.host,
        port: server.port,
        tls: server.tls,
        tlsOptions: { rejectUnauthorized: false },
        mailbox: "INBOX",
        // debug: console.log,
        searchFilter: ["UNSEEN"],
        markSeen: true,
        fetchUnreadOnStart: true,
    });
}

function getPromise(listener, timeout) {
    let promise = new Promise((resolve, reject) => {
        let timer;
        listener.on("mail", (mail, seqno) => {
            // console.log(`imap mail ${seqno}`);
            // console.log(mail);
            clearTimeout(timer);
            // console.log('Stop listener - mail received');
            listener.stop();
            resolve({ mail: mail, seqno: seqno });
        });
        listener.on("error", (err) => {
            // console.log('imap error', err);
            clearTimeout(timer);
            // console.log('Stop listener - error');
            listener.stop();
            reject(err);
        });
        listener.start();
        timer = setTimeout(() => {
            // console.log('Stop listener - timeout');
            listener.stop();
            resolve(null);
        }, timeout);
    });
    return promise;
}

module.exports.tasks = (on, config) => {
    on('task', {
        'monitor:fetch': ({ account, timeout }) => {
            let listener = getListener(account, config);
            let promise = getPromise(listener, timeout);
            return promise;
        }
    })
}
