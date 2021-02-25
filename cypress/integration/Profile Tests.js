/// <reference types="cypress" />

const navigate = require('../plugins/navigate');
const db = require('../plugins/bookclub_db');

const users = Cypress.env('users');

function assert_menu_page_not_allowed(page) {
    navigate.menu(page, {}, true);
    cy.get('.wp-die-message')
        .should('exist')
        .and('have.html', 'Sorry, you are not allowed to access this page.');
}

function set_and_check_profile(element, state = false) {
    cy.get(element).click();
    navigate.profile();
    if (state) {
        cy.get(element).should('not.be.checked');
    } else {
        cy.get(element).should('be.checked');
    }
}

describe('Profile Tests', () => {

    beforeEach(() => {
        cy.visit('/');
        navigate.ensure_sign_out();
    })

    // -----------------------------------------------------
    it('Non admin user', () => {
        cy.TestCase('Non admin user');
        let user = users['nonadminuser'];   // Denis Williams
        db.members.set(user.member, { active: 1, format: 1, ical: 1, noemail: 0 });
        db.groupmembers.update(user.member, 1, false);
        db.groupmembers.update(user.member, 2, true);

        cy.TestStep('Login user');
        navigate.login(user.login, user.password, true);

        cy.TestStep('Try to go to admin-only menu items');
        assert_menu_page_not_allowed('bc_authors');
        assert_menu_page_not_allowed('bc_covers');
        assert_menu_page_not_allowed('bc_books');
        assert_menu_page_not_allowed('bc_places');
        assert_menu_page_not_allowed('bc_dates');
        assert_menu_page_not_allowed('bc_groups');
        assert_menu_page_not_allowed('bc_news');
        assert_menu_page_not_allowed('bc_members');
        assert_menu_page_not_allowed('bc_events');
        assert_menu_page_not_allowed('bc_email');
        assert_menu_page_not_allowed('bc_settings');

        cy.TestStep('Check default profile settings for this user');
        navigate.profile();
        cy.get('#name').should('have.value', `${user.name} <${user.email}>`);
        cy.get('#pkey').should('have.value', user.webkey);
        cy.get('#format1').should('be.checked');
        cy.get('#ics1').should('be.checked');
        cy.get('#noemail0').should('be.checked');
        cy.get('#active1').should('be.checked');
        cy.get('#group1').should('not.be.checked');
        cy.get('#group2').should('be.checked');

        cy.TestStep('Change settings and check');
        set_and_check_profile('#format0');
        set_and_check_profile('#ics0');
        set_and_check_profile('#noemail1');
        set_and_check_profile('#active0');
        set_and_check_profile('#group1');
        set_and_check_profile('#group2', true);
        navigate.profile();
        cy.get('#name').should('have.attr', 'readonly');
        cy.get('#webkey').should('have.attr', 'readonly');

        cy.TestStep('Restore settings and check');
        set_and_check_profile('#format1');
        set_and_check_profile('#ics1');
        set_and_check_profile('#noemail0');
        set_and_check_profile('#active1');
        set_and_check_profile('#group1', true);
        set_and_check_profile('#group2');

        cy.finally(() => {
            cy.TestStep('Restore default settings');
            db.members.set(user.member, { active: 1, format: 1, ical: 1, noemail: 0 });
            db.groupmembers.update(user.member, 1, false);
            db.groupmembers.update(user.member, 2, true);
        })
    })
})
