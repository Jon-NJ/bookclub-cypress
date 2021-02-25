/// <reference types="cypress" />

const navigate = require('../plugins/navigate');
const db = require('../plugins/bookclub_db');
const storage = require('../plugins/storage');
const downloader = require('../plugins/downloader');

const users = Cypress.env('users');

function fetch_sections(html) {
  let sections = {};
  let section = null;

  let lines = html.replace(/\r?\n/g, ' ').match(/<b>[^<]+<\/b><br>|div[^>]+>[^<]+<\/div>/g);
  lines.forEach((line) => {
    let m = line.match(/<b>(.+) \(\d+\):<\/b>/);
    if (m) {
      section = {};
      sections[m[1]] = section;
    } else {
      m = line.match(/div[^>]+>([^<]+)<\/div>/);
      let t = m[1].trim();
      m = t.match(/(.+)\s+- (.+)/);
      if (m) {
        let comment = m[2];
        t = m[1].trim();
        section[t] = comment;
      } else {
        section[t] = null;
      }
    }
  });
  return sections;
}

function assert_who(status, member, comment = null) {
  cy.get('#who').then(($div) => {
    let sections = fetch_sections($div.html());
    cy.wrap(sections)
      .should('have.property', status);
    cy.wrap(sections[status])
      .should('have.property', member);
    if (comment) {
      cy.wrap(sections[status][member])
        .should('equal', comment);
      // } else {
      //   cy.wrap(sections[sections][member])
      //     .should('be.null');
    }
  });
}

describe('RSVP Tests', () => {

  beforeEach(() => {
    cy.visit('/');
    navigate.ensure_sign_out();
  })

  // -----------------------------------------------------
  it('RSVP non-user', () => {
    cy.TestCase('RSVP non-user');
    cy.TestStep('Ensure event created');
    db.events.ensure_event(7, 1, '19:30:00', '22:00:00',
      'Test event - Authors',
      'Danziger Str. 123, 12345 Berlin',
      'http://maps.google.com',
      'Dear {{name}}, This is an event generated for test purposes. It can be deleted.', 1)
      .then((eventid) => {
        storage.store('eventid', eventid);
      });

    cy.TestStep('Click yes from email');
    const chrisx = users['adminuser'];    // Christine Xavier
    storage.get('eventid')
      .then((eventid) => {
        navigate.rsvp(eventid, chrisx.webkey, 2);
      });

    cy.TestStep('Not invited click email maybe');
    const edvas = users['member_g2'];     // Edward Vasco
    storage.get('eventid')
      .then((eventid) => {
        navigate.rsvp(eventid, edvas.webkey, 2);
      });
    cy.get('.bc_rsvp_error')
      .should('contain.html', 'RSVP - Bad Link');

    cy.TestStep('Click email yes');
    const floru = users['member_g1'];     // Florence Unger
    storage.get('eventid')
      .then((eventid) => {
        navigate.rsvp(eventid, floru.webkey, 2);
      });
    assert_who('Attending', floru.name);
    cy.get('#comment').should('have.value', '');
    assert_who('Attending', '-- undisclosed --');

    cy.TestStep('Ensure user can signup from link');
    let signup = navigate.get_signup(floru.webkey);
    cy.contains('Click here to signup for a WordPress account.')
      .should('have.attr', 'href')
      .should('equal', signup);

    cy.TestStep('Click no');
    cy.get('#comment').type("I can't make it, too busy");
    cy.get('#button_no').click();
    cy.get('#who').should('contain.html', 'too busy');
    assert_who('Not attending', floru.name, "I can't make it, too busy");
    cy.get('#comment').should('have.value', "I can't make it, too busy");

    cy.TestStep('Click maybe');
    cy.get('#comment').clear();
    cy.get('#button_maybe').click();
    cy.get('#who').should('contain.html', 'Maybe');
    assert_who('Maybe', floru.name);
    cy.get('#comment').should('have.value', "");

    cy.TestStep('Click yes');
    cy.get('#comment').type("I'm bringing birthday cake");
    cy.get('#button_yes').click();
    cy.get('#who').should('contain.html', 'birthday cake')
    assert_who('Attending', floru.name, "I'm bringing birthday cake");
    cy.get('#comment').should('have.value', "I'm bringing birthday cake");

    cy.TestStep('Click email maybe');
    storage.get('eventid')
      .then((eventid) => {
        navigate.rsvp(eventid, floru.webkey, 3);
      });
    assert_who('Maybe', floru.name, "I'm bringing birthday cake");
    cy.get('#comment').should('have.value', "I'm bringing birthday cake");

    cy.TestStep('Download iCal');
    const fn = '/tmp/invitation.ical';
    downloader.delete(fn);
    cy.get('#button_ical').should('have.attr', 'href')
      .then((href) => {
        downloader.fetch(href, fn);
        downloader.get_size(fn).then((size) => {
          expect(size).to.be.at.least(500);
          expect(size).to.be.below(5000);
        });
      });
  })

  // -----------------------------------------------------
  it('RSVP WordPress user', () => {
    cy.TestCase('RSVP WordPress user');
    cy.TestStep('Ensure event created');
    db.events.ensure_event(7, 2, '19:00:00', '22:00:00',
      'Test event - Bloggers')
      .then((eventid) => {
        storage.store('eventid', eventid);
      });

    cy.TestStep('Other user click email maybe');
    const floru = users['member_g1'];     // Florence Unger
    storage.get('eventid')
      .then((eventid) => {
        navigate.rsvp(eventid, floru.webkey, 3);
      });

    cy.TestStep('Login and click email yes');
    const chrisx = users['adminuser'];    // Christine Xavier
    navigate.login(chrisx.login, chrisx.password);
    storage.get('eventid')
      .then((eventid) => {
        navigate.rsvp(eventid, chrisx.webkey, 2);
      });
    assert_who('Attending', chrisx.name);
    cy.get('#comment').should('have.value', '');
    assert_who('Maybe', floru.name);

    cy.TestStep('Should not offer signup link');
    cy.contains('Click here to signup for a WordPress account.')
      .should('not.exist');

    cy.TestStep('Click no');
    cy.get('#comment').type("I can't make it, too busy");
    cy.get('#button_no').click();
    cy.get('#who').should('contain.html', 'too busy');
    assert_who('Not attending', chrisx.name, "I can't make it, too busy");
    cy.get('#comment').should('have.value', "I can't make it, too busy");

    cy.TestStep('Click maybe');
    cy.get('#comment').clear();
    cy.get('#button_maybe').click();
    cy.get('#who').should('contain.html', 'Maybe (2)');
    assert_who('Maybe', chrisx.name);
    cy.get('#comment').should('have.value', "");

    cy.TestStep('Click yes');
    cy.get('#comment').type("I'm bringing birthday cake");
    cy.get('#button_yes').click();
    cy.get('#who').should('contain.html', 'birthday cake');
    assert_who('Attending', chrisx.name, "I'm bringing birthday cake");
    cy.get('#comment').should('have.value', "I'm bringing birthday cake");

    cy.TestStep('Download iCal');
    const fn = '/tmp/invitation.ical';
    downloader.delete(fn);
    cy.get('#button_ical').should('have.attr', 'href')
      .then((href) => {
        downloader.fetch(href, fn);
        downloader.get_size(fn).then((size) => {
          expect(size).to.be.at.least(500);
          expect(size).to.be.below(5000);
        });
      });
  })

})
