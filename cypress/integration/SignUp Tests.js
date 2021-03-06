/// <reference types="cypress" />

const navigate = require('../plugins/navigate');
const db = require('../plugins/bookclub_db');
const storage = require('../plugins/storage');

const users = Cypress.env('users');

function signup_error_should_be(number = '', text = '') {
  let $error = cy.get('.bc_signup_error');
  let chain = $error.should('exist');
  if (number) {
    chain = chain.should('contain', 'Error ' + number);
  }
  if (text) {
    chain = chain.should('contain', text);
  }
  return chain;
}

function message_should_be(text) {
  return cy.get('#bc_message').should('to.have.html', text);
}

function click_and_check(test) {
  cy.get('#button_create').click();
  return message_should_be(test);
}

describe('SignUp Tests', () => {

  beforeEach(() => {
    cy.visit('/');
    navigate.ensure_sign_out();
  })

  // -----------------------------------------------------
  it('Empty link', () => {
    cy.TestCase('Empty link');
    cy.TestStep('Navigate signup empty link');
    navigate.signup();

    cy.TestStep('Assert no signup error');
    cy.get('.bc_signup_error').should('not.exist');
  })

  // -----------------------------------------------------
  it('Bad link', () => {
    cy.TestCase('Bad link');
    cy.TestStep('Navigate signup bad link');
    navigate.signup('5123472770FBEB6B');

    cy.TestStep('Assert bad signup link error');
    signup_error_should_be('1009', 'Bad signup link');
  })

  // -----------------------------------------------------
  it('Already enrolled', () => {
    cy.TestCase('Already enrolled');
    cy.TestStep('Navigate signup existing admin');
    const user = users['adminuser'];
    navigate.signup(user['webkey']);

    cy.TestStep('Assert account already exists');
    signup_error_should_be('1006', 'You already have a wordpress account. Please login as "' + user['login'] + '".');
  })

  // -----------------------------------------------------
  it('Non admin member', () => {
    cy.TestCase('Non admin member');

    // Preconditions
    const first = 'Tester';
    const last = 'SignUp';
    const email = 'non.admin@gmail.com';
    const login = 'test1';
    const password = 'password1';

    db.users.delete({ user_login: login });
    db.members.delete({ email: email });

    cy.TestStep('Navigate signup non-admin user');
    db.members.create({ name: `${first} ${last}`, email: email })
      .then((member_id) => {
        storage.store('member_id', member_id);
        return db.members.find({ member_id: member_id });
      })
      .then((row) => {
        storage.store('member', row);
        navigate.signup(row.web_key);
      });

    cy.TestStep('Check default fields');
    cy.get('#first').should('have.value', first);
    cy.get('#last').should('have.value', last);
    storage.get('member')
      .then((member) => {
        cy.get('#user_email').should('have.value', member.email);
      });

    cy.TestStep('Check missing user name');
    cy.get('#user_pass').type(password);
    cy.get('#user_pass2').type(password);
    click_and_check('Missing login name.');

    cy.TestStep('Check missing first name');
    cy.get('#user_login').type(login);
    cy.get('#first').clear();
    click_and_check('Missing first name.');

    cy.TestStep('Check missing last name');
    cy.get('#first').type(first);
    cy.get('#last').clear();
    click_and_check('Missing last name.');

    cy.TestStep('Check various email problems');
    cy.get('#last').type(last);
    cy.get('#user_email').clear();
    click_and_check('Email address not acceptable.');
    cy.get('#user_email').type('abc');
    click_and_check('Email address not acceptable.');
    const user = users['adminuser'];
    cy.get('#user_email').clear().type(user.email);
    click_and_check('Email address already in use.');

    cy.TestStep('Check password requirements');
    cy.get('#user_email').clear().type(email);
    cy.get('#user_pass').clear();
    click_and_check('Password too short!');
    cy.get('#user_pass').type(password);
    cy.get('#user_pass2').clear().type(password.toUpperCase());
    click_and_check('Passwords do not match!');

    cy.TestStep('Create and login');
    cy.get('#user_pass2').clear().type(password);
    click_and_check('Account created and linked. Redirecting to login page.')
      .then(() => {
        return storage.get('member_id');
      })
      .then((member_id) => {
        return db.members.find({ member_id: member_id });
      })
      .then((member) => {
        storage.store('member', member);
        storage.store('wordpress_id', member.wordpress_id);
        cy.log(`Wordpress ID ${member.wordpress_id}`);
        return cy.wrap(member.wordpress_id);
      })
      .should('not.equal', 0);

    cy.wait(4000);
    cy.url().should('equal', navigate.get_redirect('wp-login.php', navigate.get_menu('bc_menu')));
    cy.get('#user_login').type(login);
    cy.get('#user_pass').type(password);
    cy.get('#rememberme').click();
    cy.get('#wp-submit').click();
    navigate.should_be_signed_in(login);

    cy.finally(() => {
      cy.TestStep('Remove new wordpress account');
      navigate.ensure_sign_out();
      db.users.delete({ user_login: login });

      cy.TestStep('Remove new bookclub account');
      db.members.delete({ email: email });
    });
  })

  // -----------------------------------------------------
  it('WordPress non-admin user joins', () => {

    // Preconditions

    const user = users['useronly'];
    db.users.delete_member(user.login);

    cy.TestStep('Login user');
    navigate.login(user.login, user.password, true);

    cy.TestStep('Join');
    navigate.profile();
    cy.get('#join').click();
    cy.get('#name').should('have.value', `${user.name} <${user.email}>`);
    db.users.get_id({ user_login: user.login })
      .then((wordpress_id) => {
        db.members.find({ wordpress_id: wordpress_id })
          .then((member) => {
            cy.get('#pkey').should('have.value', member.web_key);
          });
      });

    cy.finally((() => {
      cy.TestStep('Remove bookclub account');
      navigate.ensure_sign_out();
      cy.visit('/');
      db.users.delete_member(user.login);
    }));
  })

})
