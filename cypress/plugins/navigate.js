const pages = Cypress.env('pages');

function get_base() {
    return Cypress.config('baseUrl');
}

function get_url(base = '', args = {}) {
    let params = [];
    for (let key in args) {
        if (args[key]) {
            let esc = escape(args[key]);
            params.push(key + '=' + esc.replace(/\//g, '%2F'));
        }
    }
    if (params.length) {
        const joiner = base.indexOf('?') >= 0 ? '&' : '?';
        return base + joiner + params.join('&');
    } else {
        return base;
    }
}

function is_signed_in(loginname = '') {
    return cy.document()
        .then((doc) => {
            let $doc = Cypress.$(doc);
            let $bar = $doc.find('#wpadminbar');
            let result = $bar.length > 0;
            if (result && loginname) {
                let $html = $doc.find('#username');
                result = $html.html == loginname;
            }
            return cy.wrap(result);
        });
}

function is_plugin_active() {
    return cy.document()
        .then((doc) => {
            let $doc = Cypress.$(doc);
            let $disable = $doc.find('#deactivate-connect-bookclub-plugin');
            let result = $disable.length > 0;
            return cy.wrap(result);
        });
}

const signout = () => {
    return cy.document()
        .then((doc) => {
            let $doc = Cypress.$(doc);
            let $bar = $doc.find('#wpadminbar');
            if ($bar.length > 0) {
                cy.get('#wp-admin-bar-logout > a').invoke('attr', 'href').then((href) => {
                    cy.log('Signing out');
                    cy.visit(href);
                });
            }
            return null;
        });
};

const get_menu = (menu, args = {}) => {
    return get_base() + 'wp-admin/' + get_url(`admin.php?page=${menu}`, args);
};

const menu = (menu, args = {}, fail = false) => {
    if (fail) {
        cy.visit('/wp-admin/' + get_url(`admin.php?page=${menu}`, args), { failOnStatusCode: false });
    } else {
        cy.visit('/wp-admin/' + get_url(`admin.php?page=${menu}`, args));
    }
};

const login = (loginname, password, remember = false) => {
    cy.log(`Logging in "${loginname}"`)
    cy.visit('/wp-login.php').wait(500); // wait necessary because typed letters get lost sometimes
    cy.get('#user_login').clear().type(loginname).should('have.value', loginname);
    cy.get('#user_pass').type(password);
    if (remember) {
        cy.get('#rememberme').click();
    }
    cy.get('#wp-submit').click();
    cy.document()
    .then((doc) => {
        let $doc = Cypress.$(doc);
        let $button = $doc.find('#correct-admin-email');
        if ($button.length > 0) {
            cy.log('Landed on email verification page');
            cy.get('#correct-admin-email').click();
        }
        return null;
    });
    cy.get('#wpadminbar').should('exist');
};

module.exports = {
    authors: (author_id = null) => {
        if (author_id) {
            menu('bc_authors', { action: 'edit', authorid: author_id });
        } else {
            menu('bc_authors');
        }
    },
    books: (book_id = null) => {
        if (book_id) {
            menu('bc_books', { action: 'edit', bookid: book_id });
        } else {
            menu('bc_books');
        }
    },
    cron: (before = 0, after = 1000) => {
        if (before) {
            cy.wait(before);
        }
        cy.visit('/cron_elist/').contains('job status: complete');
        if (after) {
            cy.wait(after);
        }
    },
    ensure_sign_in: (loginname, password) => {
        is_signed_in(loginname).then((result) => {
            if (!result) {
                signout();
                login(loginname, password);
            }
        });
        return null;
    },
    ensure_sign_out: () => {
        is_signed_in().then((result) => {
            if (result) {
                signout();
            }
        });
        cy.get('#wpadminbar').should('not.exist');
        return null;
    },
    get_redirect: (base, page) => {
        return get_base() + get_url(base, { 'redirect_to': page });
    },
    get_authors: (author_id = null) => {
        if (author_id) {
            return get_menu('bc_authors', { action: 'edit', authorid: author_id });
        } else {
            return get_menu('bc_authors');
        }
    },
    get_books: (book_id = null) => {
        if (book_id) {
            return get_menu('bc_books', { action: 'edit', bookid: book_id });
        } else {
            return get_menu('bc_books');
        }
    },
    get_menu: get_menu,
    get_signup: (webkey) => {
        return get_base() + get_url(pages['signup'], { pkey: webkey });
    },
    is_plugin_active: () => {
        return is_plugin_active();
    },
    login: login,
    menu: menu,
    plugins: () => {
        cy.visit(get_url('wp-admin/plugins.php'));
        cy.get('#the-list').should('contain', 'Connect Bookclub Plugin');
    },
    profile: () => {
        menu('bc_menu');
    },
    revisit: () => {
        cy.url().then((url) => { cy.visit(url) });
    },
    rsvp: (eventid, webkey, status) => {
        cy.visit(get_url(pages['rsvp'], { eid: eventid, pkey: webkey, status: status }));
    },
    settings: () => {
        menu('bc_settings');
    },
    should_be_signed_in: (loginname = '') => {
        cy.get('#wpadminbar').should('exist');
        if (loginname) {
            cy.get('.username').should('to.have.html', loginname)
        }
    },
    signup: (webkey = '') => {
        cy.visit('/' + get_url(pages['signup'] + '/', { pkey: webkey }));
    }
};
