require('cypress-downloadfile/lib/downloadFileCommand');

/** Testing Framework */

Cypress.Commands.add("TestCase", (name) => {
    cy.log(`Test Case: ${name}`);
});

Cypress.Commands.add("TestStep", (name) => {
    cy.log(`Test Step: ${name}`);
});

Cypress.Commands.add("finally", (f) => f());

/** Date/Time */

// Cypress.Commands.add("dateFormat", (datetime) => {
//     cy.log('original date', datetime);
//     let dt = new Date(datetime.getTime() + datetime.getTimezoneOffset() * 60 * 1000);
//     cy.log('date with timezone', dt);
//     let str = dt.toISOString();
//     cy.log('iso string');
//     return str.substr(0, 10);
// });

// Cypress.Commands.add("timeFormat", (datetime) => {
//     let dt = new Date(datetime.getTime() + datetime.getTimezoneOffset() * 60 * 1000);
//     let str = dt.toISOString();
//     return str.substr(11, 8);
// });

// Cypress.Commands.add("datetimeFormat", (datetime) => {
//     let dt = new Date(datetime.getTime() + datetime.getTimezoneOffset() * 60 * 1000);
//     let str = dt.toISOString();
//     return str.substr(0, 10) + ' ' + str.substr(11, 8);
// });
