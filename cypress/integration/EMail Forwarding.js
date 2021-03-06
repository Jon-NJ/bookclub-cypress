/// <reference types="cypress" />

const forwarder = require('../plugins/forwarder');
const navigate = require('../plugins/navigate');
const storage = require('../plugins/storage');
const db = require('../plugins/bookclub_db');

const users = Cypress.env('users');
const listserver = Cypress.env('email').listserver;

const fetchemail = (account, timeout) => {
    return cy.task('monitor:fetch', { account, timeout });
};

describe('EMail Forwarding', () => {

    beforeEach(() => {
        navigate.cron();    // make sure that any queued emails already processed
    })

    // -----------------------------------------------------
    it('Unregistered User - no bounce', () => {
        cy.TestCase('Unregistered User - no bounce');
        const adamz = users['adminonly'];       // Adam Zappa
        const beaty = users['useronly'];        // Beatrice Young
        const chrisx = users['adminuser'];      // Christine Xavier
        const denisw = users['nonadminuser'];   // Denis Williams
        const garth = users['user_all'];        // Gary Thomas

        cy.TestStep('Clear out emails from past runs');
        fetchemail(adamz, 3000).should('be.null');
        fetchemail(beaty, 3000).should('be.null');
        fetchemail(chrisx, 3000).should('be.null');
        fetchemail(denisw, 3000).should('be.null');
        fetchemail(garth, 3000).should('be.null');

        cy.TestStep('Send to target');
        const sender = users['member_g2'];      // Edward Vasco
        const recipient = users['adminuser'];   // Christine Xavier
        forwarder.sendemail(sender, recipient.login, {
            subject: "Unregistered User - no bounce",
            text: `This is a test message that will be ignored.\nGenerated ${new Date()}.`
        });

        cy.TestStep('Check no bounce');
        navigate.cron();
        fetchemail(sender, 3000)
            .should('be.null');  // no bounce email received
    })

    // -----------------------------------------------------
    it('Bounce Problems', () => {
        cy.TestCase('Bounce Problems');
        const adamz = users['adminonly'];       // Adam Zappa
        const beaty = users['useronly'];        // Beatrice Young
        const chrisx = users['adminuser'];      // Christine Xavier
        const denisw = users['nonadminuser'];   // Denis Williams
        const garth = users['user_all'];        // Gary Thomas

        cy.TestStep('Receive flag not set bounce');
        forwarder.sendemail(adamz, garth.login, {
            subject: "Sender does not have receive flag set bounce",
            text: `This is a test message that will bounce.\nGenerated ${new Date()}.`
        });
        navigate.cron();
        // let promise = cy.task('monitor:fetch', { account: adamz, timeout: 3000 });
        fetchemail(adamz, 3000)
            .then((val) => {
                return cy.wrap(val.mail.text);
            }).should('contain', "The forwarder may only be used if you activate 'Participate in group email' on your bookclub profile page.");

        cy.TestStep('Check no target bounce');
        forwarder.sendemail(chrisx, null, {
            subject: "Test no target bounce",
            text: `This message has no target and should bounce.\nGenerated ${new Date()}.`
        });
        navigate.cron();
        fetchemail(chrisx, 3000)
            .then((val) => {
                return cy.wrap(val.mail.text);
            }).should('contain', "No target specified.");

        cy.TestStep('Recipient not found');
        forwarder.sendemail(chrisx, "Nobody", {
            subject: "Test recipient not found bounce",
            text: `The target of this message does not exist and it should bounce.\nGenerated ${new Date()}.`
        });
        navigate.cron();
        fetchemail(chrisx, 3000)
            .then((val) => {
                storage.store('email', val.mail);
                storage.store('seqno', val.seqno);
                return cy.wrap(val.mail.text);
            }).should('contain', 'User (or group) "Nobody" was not found.');

        cy.TestStep('Not in bookclub bounce');
        forwarder.sendemail(beaty, 'Author Club', {
            subject: "Test not member bounce",
            text: `This user should is not in the bookclub and the email should bounce.\nGenerated ${new Date()}.`
        });
        navigate.cron();
        fetchemail(beaty, 3000)
            .then((val) => {
                return cy.wrap(val.mail.text);
            }).should('contain', "Your are not in the bookclub so you can't send to a bookclub group");

        cy.TestStep('Not in bookclub group bounce');
        forwarder.sendemail(denisw, 'Author Club', {
            subject: "Test not in group bounce",
            text: `This user is not in the bookclub group Author Club and the email should bounce.\nGenerated ${new Date()}.`
        });
        navigate.cron();
        fetchemail(denisw, 3000)
            .then((val) => {
                return cy.wrap(val.mail.text);
            }).should('contain', "You are not in the group named 'Author Club'. You can only send emails to your own groups.");

        cy.TestStep('Not in WordPress group bounce');
        forwarder.sendemail(beaty, 'Converse', {
            subject: "Test not in WordPress group bounce",
            text: `This user is not in the WordPress group Converse and the email should bounce.\nGenerated ${new Date()}.`
        });
        navigate.cron();
        fetchemail(beaty, 3000)
            .then((val) => {
                return cy.wrap(val.mail.text);
            }).should('contain', "You are not in the group named 'Converse'. You can only send emails to your own groups.");

        cy.TestStep('Cannot send to announcement group bounce');
        forwarder.sendemail(garth, 'Disclose', {
            subject: "Test not in WordPress group bounce",
            text: `This user is not an admin and cannot send to the WordPress group Disclose. The email should bounce.\nGenerated ${new Date()}.`
        });
        navigate.cron();
        fetchemail(garth, 3000)
            .then((val) => {
                return cy.wrap(val.mail.text);
            }).should('contain', "Sorry, this is an announcement group. You can't send to it.");


        cy.TestStep('No direct messages');
        forwarder.sendemail(garth, adamz.login, {
            subject: "Test no direct message bounce",
            text: `The email is sent to someone without the receive flag on and it should bounce.\nGenerated ${new Date()}.`
        });
        navigate.cron();
        fetchemail(garth, 3000)
            .then((val) => {
                return cy.wrap(val.mail.text);
            }).should('contain', `User '${adamz.login}' has not enabled direct messages.`);
    })

    // -----------------------------------------------------
    it('Forward tests', () => {
        cy.TestCase('Forward tests');
        const adamz = users['adminonly'];       // Adam Zappa
        const beaty = users['useronly'];        // Beatrice Young
        const chrisx = users['adminuser'];      // Christine Xavier
        const denisw = users['nonadminuser'];   // Denis Williams
        const garth = users['user_all'];        // Gary Thomas

        cy.TestStep('Target user name');
        forwarder.sendemail(garth, beaty.name, {
            subject: "Test direct message",
            text: `The email is sent as a direct message.\nGenerated ${new Date()}.`
        });
        navigate.cron();
        fetchemail(beaty, 3000)
            .then((val) => {
                storage.store('from', val.mail.from.text);
                storage.store('text', val.mail.text);
            });
        storage.get('from')
            .should('equal', `${garth.login} <${listserver}>`);
        storage.get('text')
            .should('contain', `Direct message sent by "${garth.name}".`);
        storage.get('text')
            .should('contain', `Reply to "${garth.login} <${listserver}>".`);

        cy.TestStep('HTML content');
        let token = db.generate_web_key();
        forwarder.sendemail(denisw, chrisx.login, {
            subject: "Test HTML message",
            text: `This is the text part.\nText token ${token}.\nGenerated ${new Date()}.`,
            html: `<p>This is the HTML part.</p><p>HTML token ${token}.</p><p>Generated ${new Date()}.</p>`,
        });
        navigate.cron();
        fetchemail(chrisx, 3000)
            .then((val) => {
                storage.store('from', val.mail.from.text);
                storage.store('text', val.mail.text);
                storage.store('html', val.mail.html);
            });
        storage.get('from')
            .should('equal', `${denisw.login} <${listserver}>`);
        storage.get('text')
            .should('contain', `Direct message sent by "${denisw.name}".`);
        storage.get('text')
            .should('contain', `Reply to "${denisw.login} <${listserver}>".`);
        storage.get('text')
            .should('contain', `Text token ${token}.`);
        storage.get('html')
            .should('contain', `Direct message sent by "${denisw.name}".`);
        storage.get('html')
            .should('contain', `Reply to "${denisw.login} &lt;${listserver}&gt;".`);
        storage.get('html')
            .should('contain', `HTML token ${token}.`);

        cy.TestStep('Bookclub group');
        forwarder.sendemail(garth, 'Bloggers', {
            subject: "Test message to bookclub group",
            text: `This is the text part.\nGenerated ${new Date()}.`,
            html: `<p>This is the HTML part.</p><p>Generated ${new Date()}.</p>`,
        });
        navigate.cron();
        fetchemail(denisw, 3000)
            .then((val) => {
                storage.store('denisw_from', val.mail.from.text);
                storage.store('denisw_text', val.mail.text);
                storage.store('denisw_html', val.mail.html);
            });
        fetchemail(garth, 3000)
            .then((val) => {
                storage.store('garth_from', val.mail.from.text);
                storage.store('garth_text', val.mail.text);
                storage.store('garth_html', val.mail.html);
            });
        fetchemail(chrisx, 3000)
            .then((val) => {
                storage.store('chrisx_mail', val);
            });
        storage.get('denisw_from').should('equal', `Bloggers <${listserver}>`);
        storage.get('denisw_text').should('contain', `List message sent by "${garth.name}".`);
        storage.get('denisw_text').should('contain', `You can reply directly to "${garth.login} <${listserver}>"`);
        storage.get('denisw_text').should('contain', `or reply to the list at "Bloggers <${listserver}>".`);
        storage.get('denisw_html').should('contain', `List message sent by "${garth.name}".`);
        storage.get('denisw_html').should('contain', `You can reply directly to "${garth.login} &lt;${listserver}&gt;"`);
        storage.get('denisw_html').should('contain', `or reply to the list at "Bloggers &lt;${listserver}&gt;".`);
        storage.get('garth_from').should('equal', `Bloggers <${listserver}>`);
        storage.get('chrisx_mail').should('be.null');

        cy.TestStep('WordPress group by Admin not in the group');
        token = db.generate_web_key();
        forwarder.sendemail(chrisx, 'Converse', {
            subject: "Test message to WordPress group",
            text: `This message is for the Converse group.\nText token ${token}.\nGenerated ${new Date()}.`
        });
        navigate.cron();
        fetchemail(adamz, 3000)
            .then((val) => {
                storage.store('adamz_from', val.mail.from.text);
                storage.store('adamz_text', val.mail.text);
            });
        fetchemail(denisw, 3000)
            .then((val) => {
                storage.store('denisw_from', val.mail.from.text);
                storage.store('denisw_text', val.mail.text);
            });
        fetchemail(garth, 3000)
            .then((val) => {
                storage.store('garth_from', val.mail.from.text);
                storage.store('garth_text', val.mail.text);
            });
        fetchemail(chrisx, 3000)
            .then((val) => {
                storage.store('chrisx_mail', val);
            });
        storage.get('adamz_from').should('equal', `Converse <${listserver}>`);
        storage.get('adamz_text').should('contain', `Text token ${token}.`);
        storage.get('adamz_text').should('contain', `List message sent by "${chrisx.name}".`);
        storage.get('adamz_text').should('contain', `You can reply directly to "${chrisx.login} <${listserver}>"`);
        storage.get('adamz_text').should('contain', `or reply to the list at "Converse <${listserver}>".`);
        storage.get('denisw_text').should('contain', `Text token ${token}.`);
        storage.get('garth_text').should('contain', `Text token ${token}.`);
        storage.get('chrisx_mail').should('be.null');

        cy.TestStep('WordPress group by non-admin');
        token = db.generate_web_key();
        forwarder.sendemail(denisw, 'Converse', {
            subject: "Test message to WordPress group",
            text: `This message is for the Converse group.\nText token ${token}.\nGenerated ${new Date()}.`
        });
        navigate.cron();
        fetchemail(adamz, 3000)
            .then((val) => {
                storage.store('adamz_from', val.mail.from.text);
                storage.store('adamz_text', val.mail.text);
            });
        fetchemail(denisw, 3000)
            .then((val) => {
                storage.store('denisw_from', val.mail.from.text);
                storage.store('denisw_text', val.mail.text);
            });
        fetchemail(garth, 3000)
            .then((val) => {
                storage.store('garth_from', val.mail.from.text);
                storage.store('garth_text', val.mail.text);
            });
        fetchemail(chrisx, 3000)
            .then((val) => {
                storage.store('chrisx_mail', val);
            });
        storage.get('adamz_from').should('equal', `Converse <${listserver}>`);
        storage.get('adamz_text').should('contain', `Text token ${token}.`);
        storage.get('adamz_text').should('contain', `List message sent by "${denisw.name}".`);
        storage.get('adamz_text').should('contain', `You can reply directly to "${denisw.login} <${listserver}>"`);
        storage.get('adamz_text').should('contain', `or reply to the list at "Converse <${listserver}>".`);
        storage.get('denisw_text').should('contain', `Text token ${token}.`);
        storage.get('garth_text').should('contain', `Text token ${token}.`);
        storage.get('chrisx_mail').should('be.null');

        cy.TestStep('Announcement group');
        token = db.generate_web_key();
        forwarder.sendemail(chrisx, 'Disclose', {
            subject: "Test message to Announcement group",
            text: `This message is for the Disclose group.\nText token ${token}.\nGenerated ${new Date()}.`
        });
        navigate.cron();
        fetchemail(adamz, 3000)
            .then((val) => {
                storage.store('adamz_from', val.mail.from.text);
                storage.store('adamz_text', val.mail.text);
            });
        fetchemail(chrisx, 3000)
            .then((val) => {
                storage.store('chrisx_from', val.mail.from.text);
                storage.store('chrisx_text', val.mail.text);
            });
        fetchemail(garth, 3000)
            .then((val) => {
                storage.store('garth_from', val.mail.from.text);
                storage.store('garth_text', val.mail.text);
            });
        fetchemail(beaty, 3000)
            .then((val) => {
                storage.store('beaty_mail', val);
            });
        storage.get('adamz_from').should('equal', `Disclose <${listserver}>`);
        storage.get('adamz_text').should('contain', `Text token ${token}.`);
        storage.get('adamz_text').should('contain', `List message sent by "${chrisx.name}".`);
        storage.get('adamz_text').should('contain', `You can reply directly to "${chrisx.login} <${listserver}>"`);
        storage.get('adamz_text').should('contain', `or reply to the list at "Disclose <${listserver}>".`);
        storage.get('chrisx_text').should('contain', `Text token ${token}.`);
        storage.get('garth_text').should('contain', `Text token ${token}.`);
        storage.get('beaty_mail').should('be.null');
    })

})
