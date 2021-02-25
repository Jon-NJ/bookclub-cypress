/// <reference types="cypress" />

const navigate = require('../plugins/navigate');
const db = require('../plugins/bookclub_db');
const pages = Cypress.env('pages');

const users = Cypress.env('users');
const scripts = Cypress.env('scripts');

function turn_on_receive_flag(key) {
    navigate.ensure_sign_out();
    const user = users[key];
    navigate.login(user.login, user.password, true);
    navigate.profile();
    cy.get('#receive1').click();
}

describe('Test Install', () => {

    // -----------------------------------------------------
    it('Activate plugin', () => {
        cy.TestCase('Activate plugin');
        navigate.ensure_sign_out();

        cy.TestStep('Activate plugin');
        const user = users['admin'];
        navigate.login(user.login, user.password, true);
        navigate.plugins();
        navigate.is_plugin_active().then((is_active) => {
            if (is_active) {
                cy.log('Plugin already active.');
            } else {
                cy.get('#activate-connect-bookclub-plugin').click();
            }
        });

        cy.TestStep('Check tables');
        db.table_exists('events').should('equal', 1);
        db.table_exists('groupmembers').should('equal', 1);
        db.table_exists('members').should('equal', 1);
        db.table_exists('participants').should('equal', 1);
        db.table_exists('rsvps').should('equal', 1);
    })

    // -----------------------------------------------------
    it('Add BookClub master data', () => {
        cy.TestCase('Add BookClub master data');
        cy.TestStep('Check if data needs to be imported, then import it');
        const user = users['adminuser'];
        db.members.find({ member_id: user.member })
            .then((row) => {
                if (!row) {
                    cy.log('Importing master data');
                    return cy.task('db:script', scripts['bookclub']);
                }
            });
    })

    // -----------------------------------------------------
    it('Configure plugin', () => {
        cy.TestCase('Configure plugin');
        const forwarder = Cypress.env('email')['listserver'];
        const fpassword = Cypress.env('email')['listserver-password'];
        const email = users['support'].email;
        const epassword = users['support'].password;
        const support = users['support'].email;
        db.options.get('bc_defines')
            .then((val) => {
                if (!val) {
                    cy.TestStep('Configure EMail');
                    const user = users['admin'];
                    navigate.login(user.login, user.password, true);
                    navigate.settings();
                    cy.get('#defines')
                        .type(`forwarder=${forwarder}{enter}` +
                            `sender=${email}{enter}` +
                            `signature=Test Bookclub{enter}` +
                            `support=${support}{enter}` +
                            `who=Test Bookclub{enter}`);
                    cy.get('#email_password').clear().type(epassword);
                    cy.get('#email_params')
                        .type("host=ssl://sunshine.dyndns.myonlineportal.de{enter}" +
                            "port=465{enter}" +
                            "auth=true{enter}" +
                            "username={{}{{}sender}}{enter}" +
                            "password={{}{{}email_password}}{enter}" +
                            "ssl.verify_peer=false{enter}" +
                            "ssl.allow_self_signed=true{enter}");
                    cy.get('#email_headers')
                        .type("From={{}{{}who}} <{{}{{}sender}}>{enter}" +
                            "Return-Path={{}{{}sender}}{enter}" +
                            "To={{}{{}utf8name}} <{{}{{}email}}>{enter}" +
                            "Subject={{}{{}subject}}{enter}" +
                            "Content-Type={{}{{}content-type}}{enter}" +
                            "MIME-Version=1.0{enter}");

                    cy.TestStep('Configure Forwarding');
                    cy.get('#tab2').click();
                    cy.get('#forward_imap')
                        .type('{{}sunshine.dyndns.myonlineportal.de:993/imap/ssl/novalidate-cert}INBOX');
                    cy.get('#forward_user').type('{{}{{}forwarder}}');
                    cy.get('#forward_password').clear().type(fpassword);
                    cy.get('#forward_params')
                        .type("host=ssl://sunshine.dyndns.myonlineportal.de{enter}" +
                            "port=465{enter}" +
                            "auth=true{enter}" +
                            "username={{}{{}forwarder}}{enter}" +
                            "password={{}{{}forward_password}}{enter}" +
                            "ssl.verify_peer=false{enter}" +
                            "ssl.allow_self_signed=true{enter}");
                    cy.get('#forward_headers')
                        .type("From={{}{{}utf8from}} <{{}{{}forwarder}}>{enter}" +
                            "To={{}{{}utf8name}} <{{}{{}email}}>{enter}" +
                            "Subject={{}{{}subject}}{enter}" +
                            "@List-Id={{}{{}who}} <{{}{{}forwarder}}>{enter}" +
                            "@List-Owner=<mailto:{{}{{}support}}>{enter}" +
                            "@List-Help=<mailto:{{}{{}support}}?subject=help>{enter}" +
                            "Content-Type={{}{{}content-type}}{enter}" +
                            "MIME-Version=1.0{enter}");

                    cy.TestStep('Configure Pages');
                    cy.get('#tab3').click();
                    cy.get('#page_book').type(pages['book']);
                    cy.get('#page_forthcoming').type(pages['forthcoming']);
                    cy.get('#page_previous').type(pages['previous']);
                    cy.get('#page_rsvp').type(pages['rsvp']);
                    cy.get('#page_signup').type(pages['signup']);

                    cy.TestStep('Save');
                    cy.get('#save_settings').click();
                }
            });
    })

    // -----------------------------------------------------
    it('Configure Users', () => {
        cy.TestCase('Configure Users');
        cy.TestStep('Turn on receive from other flag for selected users');
        cy.visit('/');
        turn_on_receive_flag('useronly');
        turn_on_receive_flag('adminuser');
        turn_on_receive_flag('user_all');
        turn_on_receive_flag('nonadminuser');
    })

})
