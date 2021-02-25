/// <reference types="cypress" />

const navigate = require('../plugins/navigate');
const db = require('../plugins/bookclub_db');
const storage = require('../plugins/storage');

const users = Cypress.env('users');
const user = users['adminuser'];    // Christine Xavier

describe('Book Tests', () => {

    beforeEach(() => {
        cy.visit('/');
        navigate.ensure_sign_in(user.login, user.password);
        navigate.books();
    })

    // -----------------------------------------------------
    it('Add mostly empty book', () => {
        cy.TestCase('Add mostly empty book');
        cy.TestStep('Get next id');
        db.books.get_new().then((book_id) => {
            storage.store('book_id', book_id);
        });

        cy.TestStep('Add mostly empty book');
        let author = 'Margaret Atwood';
        let author_id = 1;
        cy.get('#button_add').should('have.attr', 'disabled');
        cy.get('#author_name').type(author);
        cy.get('#author_id').should('have.value', author_id);
        cy.get('#button_add').should('not.have.attr', 'disabled');
        cy.get('#button_add').click();
        cy.get('#book_id').should('have.attr', 'readonly');
        storage.get('book_id').then((book_id) => {
            cy.get('#book_id').should('have.value', book_id);
        });
        cy.get('#author_name').should('have.value', author);
        cy.get('#author_id')
            .should('have.value', author_id)
            .and('have.attr', 'readonly');

        cy.TestStep('Update author and check');
        author = 'Yoko Ogawa';
        author_id = 3;
        cy.get('#author_name').clear().type(author);
        cy.get('#author_id').should('have.value', author_id);
        cy.get('#button_save').click();
        navigate.revisit();
        cy.get('#author_name').should('have.value', author);

        cy.TestStep('Update title and check');
        const title = 'The Diving Pool';
        cy.get('#title').type(title);
        cy.get('#button_save').click();
        navigate.revisit();
        cy.get('#title').should('have.value', title);

        cy.TestStep('Update cover and check');
        const cover = 'Diving_Pool.png';
        cy.get('#cover_url').type(cover);
        cy.get('#button_save').click();
        navigate.revisit();
        cy.get('#cover_url').should('have.value', cover);

        cy.TestStep('Update description and check');
        const desc = `From Akutagawa Award-winning author Yoko Ogawa comes a haunting trio of novellas about love, fertility, obsession, and how even the most innocent gestures may contain a hairline crack of cruel intent.
A lonely teenage girl falls in love with her foster brother as she watches him leap from a high diving board into a pool—a peculiar infatuation that sends unexpected ripples through her life.`;
        cy.get('#summary').type(desc);
        cy.get('#button_save').click();
        navigate.revisit();
        cy.get('#summary').should('have.html', desc);

        cy.TestStep('Delete and check');
        let count = 0;
        cy.on('window:confirm', () => {
            // don't confirm the first time, wait until the second
            ++count;
            return count > 1;
        });
        cy.get('#button_delete').click();
        storage.get('book_id').then((book_id) => {
            cy.get('#book_id').should('have.value', book_id);
        });
        cy.get('#button_delete').click();
        cy.url().should('eq', navigate.get_books());
        storage.get('book_id').then((book_id) => {
            db.books.get_new().then((new_id) => {
                expect(new_id).to.eq(book_id);
            });
        });

        cy.finally(() => {
            cy.TestStep('Remove book');
            storage.get('book_id').then((book_id) => {
                if (book_id) {
                    db.books.delete({ book_id: book_id });
                }
            });
        })
    })


    // -----------------------------------------------------
    it('Add book', () => {
        cy.TestCase('Add book');
        cy.TestStep('Get next id');
        db.books.get_new().then((book_id) => {
            storage.store('book_id', book_id);
        });

        cy.TestStep('Add book');
        const author = 'Yoko Ogawa';
        const title = 'The Diving Pool';
        const cover = 'Diving_Pool.png';
        const desc = `From Akutagawa Award-winning author Yoko Ogawa comes a haunting trio of novellas about love, fertility, obsession, and how even the most innocent gestures may contain a hairline crack of cruel intent.
A lonely teenage girl falls in love with her foster brother as she watches him leap from a high diving board into a pool—a peculiar infatuation that sends unexpected ripples through her life.`;
        cy.get('#author_name').type(author);
        cy.get('#title').type(title);
        cy.get('#cover_url').type(cover);
        cy.get('#summary').type(desc);
        cy.get('#button_add').click();

        cy.TestStep('Check fields');
        cy.get('#author_name').should('have.value', author);
        cy.get('#title').should('have.value', title);
        cy.get('#cover_url').should('have.value', cover)
        cy.get('#summary').should('have.html', desc)

        cy.TestStep('Delete and check');
        cy.get('#button_delete').click();
        cy.url().should('eq', navigate.get_books());
        storage.get('book_id').then((book_id) => {
            db.books.get_new().then((new_id) => {
                expect(new_id).to.eq(book_id);
            });
        });

        cy.finally(() => {
            cy.TestStep('Remove book');
            storage.get('book_id').then((book_id) => {
                if (book_id) {
                    db.books.delete({ book_id: book_id });
                }
            });
        })
    })

    // -----------------------------------------------------
    it('Search books not found', () => {
        cy.TestCase('Search books not found');
        cy.TestStep('Search by non-existent ID');
        cy.get('#book_id').type(9999);
        cy.get('#button_search').click();
        cy.get('.bc_noresults').should('exist');
        cy.get('#book_id').clear();

        cy.TestStep('Search by non-existent title');
        cy.get('#title').type('xxxxxxx');
        cy.get('#button_search').click();
        cy.get('.bc_noresults').should('exist');
        cy.get('#title').clear();

        cy.TestStep('Search by non-existent cover');
        cy.get('#cover_url').type('xxxxxxx');
        cy.get('#button_search').click();
        cy.get('.bc_noresults').should('exist');
        cy.get('#cover_url').clear();

        cy.TestStep('Search by non-existent author');
        cy.get('#author_name').type('xxxxxxx');
        cy.get('#button_search').click();
        cy.get('.bc_noresults').should('exist');
        cy.get('#author_name').clear();

        cy.TestStep('Search by non-existent description');
        cy.get('#summary').type('xxxxxxx');
        cy.get('#button_search').click();
        cy.get('.bc_noresults').should('exist');
        cy.get('#summary').clear();

    })

    // -----------------------------------------------------
    it('Search books found', () => {
        cy.TestCase('Search books found');
        cy.TestStep('Search by ID');
        cy.get('#book_id').type(2);
        cy.get('#button_search').click();
        cy.get('.bc_books_results').should('contain', 'George Orwell');
        cy.get('#book_id').clear();

        cy.TestStep('Search by title');
        cy.get('#title').type('police');
        cy.get('#button_search').click();
        cy.get('.bc_books_results').should('contain', 'The Memory Police');
        cy.get('#title').clear();

        cy.TestStep('Search by cover');
        cy.get('#cover_url').type('tale.j');
        cy.get('#button_search').click();
        cy.get('.bc_books_results').should('contain', 'Margaret Atwood');
        cy.get('#cover_url').clear();

        cy.TestStep('Search by author');
        cy.get('#author_name').type('orwell');
        cy.get('#button_search').click();
        cy.get('.bc_books_results')
            .should('contain', '1984')
            .and('contain', 'Animal Farm');
        cy.get('#author_name').clear();

        cy.TestStep('Search by description');
        cy.get('#summary').type('heroes of this battle are snowball and boxer');
        cy.get('#button_search').click();
        cy.get('.bc_books_results').should('contain', 'Animal Farm');
        cy.get('#summary').clear();

        cy.TestStep('Search by all fields');
        cy.get('#book_id').type(3);
        cy.get('#title').type('memory');
        cy.get('#cover_url').type('police');
        cy.get('#author_name').type('yoko');
        cy.get('#summary').type('when a young novelist discovers');
        cy.get('#button_search').click();
        cy.get('.bc_books_results').should('contain', 'Yoko Ogawa');
    })

    // -----------------------------------------------------
    it('Check search selection', () => {
        cy.TestCase('Check search selection');
        cy.TestStep('Search all - Select by ID');
        cy.get('#button_search').click();
        cy.get('#bid_4').click();
        cy.get('#author_name').should('have.value', 'George Orwell');
        cy.get('#button_reset').click();
        cy.url().should('eq', navigate.get_books());

        cy.TestStep('Search all - Select by title');
        cy.get('#button_search').click();
        cy.get('#title_5').click();
        cy.get('#title').should('have.value', 'The Blind Assassin');
        cy.get('#button_reset').click();
        cy.url().should('eq', navigate.get_books());

        cy.TestStep('Search all - Select by author');
        cy.get('#button_search').click();
        cy.get('#author_3').click();
        cy.get('#author_name').should('have.value', 'Yoko Ogawa');
        cy.get('#button_reset').click();
        cy.url().should('eq', navigate.get_books());
    })

})
