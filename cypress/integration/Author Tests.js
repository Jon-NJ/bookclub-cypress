/// <reference types="cypress" />

const navigate = require('../plugins/navigate');
const db = require('../plugins/bookclub_db');
const storage = require('../plugins/storage');

const users = Cypress.env('users');
const user = users['adminuser'];    // Christine Xavier

describe('Author Tests', () => {

    beforeEach(() => {
        cy.visit('/');
        navigate.ensure_sign_in(user.login, user.password);
        navigate.authors();
    })

    // -----------------------------------------------------
    it('Add empty author', () => {
        cy.TestCase('Add empty author');
        const name = 'Author Name';
        storage.remove('author_id');
        db.authors.delete({ name: '' });
        db.authors.delete({ name: name });

        cy.TestStep('Get next id');
        db.authors.get_new().then((author_id) => {
            storage.store('author_id', author_id);
        });

        cy.TestStep('Add empty author');
        cy.get('#button_add').click();
        cy.get('#author_id').should('have.attr', 'readonly');
        storage.get('author_id').then((author_id) => {
            cy.get('#author_id').should('have.value', author_id);
        });

        cy.TestStep('Update name and check');
        cy.get('#name').type(name);
        cy.get('#button_save').click();
        navigate.revisit();
        cy.get('#name').should('have.value', name);

        cy.TestStep('Update link and check');
        const link = 'https://www.wikipedia.com';
        cy.get('#link').type(link);
        cy.get('#button_save').click();
        navigate.revisit();
        cy.get('#link').should('have.value', link);

        cy.TestStep('Update bio and check');
        const bio = `Margaret Eleanor Atwood is a Canadian poet, novelist, literary critic, essayist, and environmental activist.
She is a winner of the Arthur C. Clarke Award and Prince of Asturias Award for Literature.
Atwood is also the inventor, and developer, of the LongPen and associated technologies that facilitate the remote robotic writing of documents.`;
        cy.get('#bio').type(bio);
        cy.get('#button_save').click();
        navigate.revisit();
        cy.get('#bio').should('have.value', bio);

        cy.TestStep('Delete and check');
        let count = 0;
        cy.on('window:confirm', () => {
            // don't confirm the first time, wait until the second
            ++count;
            return count > 1;
        });
        cy.get('#button_delete').click();
        storage.get('author_id').then((author_id) => {
            cy.get('#author_id').should('have.value', author_id);
        });
        cy.get('#button_delete').click();
        cy.url().should('eq', navigate.get_authors());
        storage.get('author_id').then((author_id) => {
            db.authors.get_new().then((new_id) => {
                expect(new_id).to.eq(author_id);
            });
        });

        cy.finally(() => {
            cy.TestStep('Remove author');
            storage.get('author_id').then((author_id) => {
                if (author_id) {
                    db.authors.delete({ author_id: author_id });
                }
            });
        })
    })

    // -----------------------------------------------------
    it('Add author', () => {
        cy.TestCase('Add author');
        const name = 'Edward Snowden';
        storage.remove('author_id');
        db.authors.delete({ name: name });

        cy.TestStep('Get next id');
        db.authors.get_new().then((author_id) => {
            storage.store('author_id', author_id);
        });

        cy.TestStep('Add author');
        const link = 'https://en.wikipedia.org/wiki/Edward_Snowden';
        const bio = `Edward Joseph Snowden (born June 21, 1983) is an American whistleblower who copied and leaked highly classified information from the National Security Agency (NSA) in 2013 when he was a Central Intelligence Agency (CIA) employee and subcontractor.
His disclosures revealed numerous global surveillance programs, many run by the NSA and the Five Eyes Intelligence Alliance with the cooperation of telecommunication companies and European governments, and prompted a cultural discussion about national security and individual privacy.`;
        cy.get('#name').type(name);
        cy.get('#link').type(link);
        cy.get('#bio').type(bio);
        cy.get('#button_add').click();

        cy.TestStep('Check fields');
        cy.get('#author_id').should('have.attr', 'readonly');
        storage.get('author_id').then((author_id) => {
            cy.get('#author_id').should('have.value', author_id);
        });
        cy.get('#name').should('have.value', name);
        cy.get('#link').should('have.value', link);
        cy.get('#bio').should('have.html', bio);

        cy.TestStep('Delete and check');
        cy.get('#button_delete').click();
        cy.url().should('eq', navigate.get_authors());
        storage.get('author_id').then((author_id) => {
            db.authors.get_new().then((new_id) => {
                expect(new_id).to.eq(author_id);
            });
        });

        cy.finally(() => {
            cy.TestStep('Remove author');
            storage.get('author_id').then((author_id) => {
                if (author_id) {
                    db.authors.delete({ author_id: author_id });
                }
            });
        })
    })

    // -----------------------------------------------------
    it('Search authors not found', () => {
        cy.TestCase('Search authors not found');

        cy.TestStep('Search by non-existent ID');
        cy.get('#author_id').type(9999);
        cy.get('#button_search').click();
        cy.get('.bc_noresults').should('exist');
        cy.get('#author_id').clear();

        cy.TestStep('Search by non-existent name');
        cy.get('#name').type('xxxxxxx');
        cy.get('#button_search').click();
        cy.get('.bc_noresults').should('exist');
        cy.get('#name').clear();

        cy.TestStep('Search by non-existent link');
        cy.get('#link').type('xxxxxxx');
        cy.get('#button_search').click();
        cy.get('.bc_noresults').should('exist');
        cy.get('#link').clear();

        cy.TestStep('Search by non-existent bio');
        cy.get('#bio').type('xxxxxxx');
        cy.get('#button_search').click();
        cy.get('.bc_noresults').should('exist');
        cy.get('#bio').clear();
    })

    // -----------------------------------------------------
    it('Search authors found', () => {
        cy.TestCase('Search authors not found');

        cy.TestStep('Search by ID');
        cy.get('#author_id').type(3);
        cy.get('#button_search').click();
        cy.get('.bc_authors_results').should('contain', 'Yoko Ogawa');
        cy.get('#author_id').clear();

        cy.TestStep('Search by name');
        cy.get('#name').type('george');
        cy.get('#button_search').click();
        cy.get('.bc_authors_results').should('contain', 'George Orwell');
        cy.get('#name').clear();

        cy.TestStep('Search by link');
        cy.get('#link').type('margaretatwood.CA');
        cy.get('#button_search').click();
        cy.get('.bc_authors_results').should('contain', 'Margaret Atwood');
        cy.get('#link').clear();

        cy.TestStep('Search by bio');
        cy.get('#bio').type('waseda university');
        cy.get('#button_search').click();
        cy.get('.bc_authors_results').should('contain', 'Yoko Ogawa');
        cy.get('#bio').clear();

        cy.TestStep('Search by all fields');
        cy.get('#author_id').type(2);
        cy.get('#name').type('george');
        cy.get('#link').type('George-Orwell.org');
        cy.get('#bio').type('Chronicler of english Culture');
        cy.get('#button_search').click();
        cy.get('.bc_authors_results').should('contain', 'George Orwell');
    })

    // -----------------------------------------------------
    it('Check search selection and delete message for author with books', () => {
        cy.TestCase('Check search selection and delete message for author with books');
        cy.TestStep('Search all - Select by ID');
        cy.get('#button_search').click();
        cy.get('#id_3').click();
        cy.get('#name').should('have.value', 'Yoko Ogawa');
        cy.get('#button_reset').click();
        cy.url().should('eq', navigate.get_authors());

        cy.TestStep('Search all - Select by author');
        cy.get('#button_search').click();
        cy.get('#author_2').click();
        cy.get('#name').should('have.value', 'George Orwell');

        cy.TestStep('Try delete');
        cy.get('#button_delete').click();
        cy.get('#bc_message').should('have.html', 'Cannot delete author of 2 book(s). Please delete or reassign the book(s) first.');
        cy.url().should('eq', navigate.get_authors(2));
    })

})
