const nodemailer = require('nodemailer');

function getTransport(sender, server) {
    return nodemailer.createTransport({
        host: server.host,
        port: server.port,
        auth: {
            user: sender.email,
            pass: sender.password
        }
    });
}

const sendemail = (sender, target, params, config) => {
    const conf = config.env.email;
    const transporter = getTransport(sender, conf.snmp);
    let email = {
        from: `${sender.name} <${sender.email}>`,
        to: target ? `${target} <${conf.listserver}>` : `${conf.listserver}`,
    };
    for (let key in params) {
        email[key] = params[key];
    }
    console.log(`send email ${sender.name} ${target}`);
    return transporter.sendMail(email);
};

module.exports.sendemail = (sender, target, params) => {
    return cy.task('forward:send', { sender, target, params });
};

module.exports.tasks = (on, config) => {
    on('task', {
        'forward:send': ({ sender, target, params }) => {
            return sendemail(sender, target, params, config);
        }
    })
}
