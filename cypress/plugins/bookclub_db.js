const tables = Cypress.env('tables');

/** Task functions */

function select(sql) {
    return cy.task('db:select', sql);
}

function selectItem(sql) {
    return cy.task('db:selectItem', sql);
}

function selectRow(sql) {
    return cy.task('db:selectRow', sql);
}

function execute(sql) {
    return cy.task('db:execute', sql);
}

function exists(table) {
    return cy.task('db:exists', tables[table]);
}

/** Query Builder functions */

function set(parms) {
    var sets = [];
    for (let key in parms) {
        sets.push(`${key} = '${parms[key]}'`);
    }
    return ' SET ' + sets.join(', ');
}

function where(parms) {
    var conditions = [];
    if (parms) {
        for (let key in parms) {
            conditions.push(`${key} = '${parms[key]}'`);
        }
        return ' WHERE ' + conditions.join(' AND ');
    }
    return '';
}

function insert(table, parms) {
    var fields = [];
    var values = [];
    for (let key in parms) {
        fields.push(key);
        values.push(parms[key]);
    }
    var sql = '';
    if (values.length) {
        sql = "'" + values.join("','") + "'";
    }
    return `INSERT INTO ${table} (` + fields.join(',') + `) VALUES (${sql})`;
}

/** Utility functions */

function generate_random_id(charset, len) {
    var chars = [];
    for (let i = 0; i < len; ++i) {
        let pos = Math.floor(Math.random() * charset.length);
        chars.push(charset.substring(pos, pos + 1));
    }
    return chars.join('');
}

function generate_web_key() {
    let result = generate_random_id('0123456789ABCDEF', 16);
    return result;
}

const table_exists = (table) => {
    return exists(table);
};

const dateFormat = (datetime) => {
    let dt = new Date(datetime.getTime() + datetime.getTimezoneOffset() * 60 * 1000);
    let str = dt.toISOString();
    return str.substr(0, 10);
};

/** authors functions */

const authors_get_new = () => {
    return selectItem(`SELECT COALESCE(MAX(author_id), 0) + 1 AS author_id FROM ${tables['authors']}`);
};

const authors_delete = (parms) => {
    return execute(`DELETE FROM ${tables['authors']}` + where(parms));
};

const authors = {
    delete: authors_delete,
    get_new: authors_get_new
};

/** books functions */

const books_get_new = () => {
    return selectItem(`SELECT COALESCE(MAX(book_id), 0) + 1 AS book_id FROM ${tables['books']}`);
};

const books_delete = (parms) => {
    return execute(`DELETE FROM ${tables['books']}` + where(parms));
};

const books = {
    delete: books_delete,
    get_new: books_get_new
};

/** events functions */

const events_create = (parms) => {
    return execute(insert(tables['events'], parms));
};

const events_ensure_event =
    (days_ahead, groupid, starttime = '19:30:00', endtime = '22:00:00', summary = 'Test event',
        location = 'Danziger Str. 123, 12345 Berlin', map = 'http://maps.google.com',
        description = 'Dear {{name}}, This is an event generated for test purposes. It can be deleted.',
        is_private = 0, priority = 0, max_attend = 0) => {
        let eventdate = new Date();
        eventdate.setDate(eventdate.getDate() + days_ahead);
        // let future_date = cy.dateFormat(eventdate);
        let future_date = dateFormat(eventdate);
        let eventid = future_date.substr(0, 4) + future_date.substr(5, 2) + future_date.substr(8, 2) + '_bc_' + groupid;
        return events_find({ event_id: eventid })
            .then((row) => {
                let p;
                if (row) {
                    p = participants_delete({ event_id: eventid })
                        .then(() => {
                            rsvps_delete({ event_id: eventid });
                        });
                } else {
                    p = events_create({
                        event_id: eventid, starttime: future_date + ' ' + starttime, endtime: future_date + ' ' + endtime,
                        summary: summary, location: location, map: map, description: description,
                        private: is_private, priority: priority, max_attend: max_attend
                    });
                }
                p.then(() => {
                    participants_invite(eventid, groupid);
                });
                return cy.wrap(eventid);
            });
    };

const events_find = (parms) => {
    return selectRow(`SELECT * FROM ${tables['events']}` + where(parms));
};

const events = {
    create: events_create,
    ensure_event: events_ensure_event,
    find: events_find
};

/** groupmembers functions */

const groupmembers_update = (member_id, group_id, value) => {
    let result = execute(`DELETE FROM ${tables['groupmembers']} ` + where({ member_id: member_id, group_id: group_id }));
    if (value) {
        result = execute(insert(tables['groupmembers'], { member_id: member_id, group_id: group_id }));
    }
    return result;
};

const groupmembers = {
    update: groupmembers_update
};

/** members functions */

const members_clear_wordpress_id = (member_id) => {
    return execute(`UPDATE ${tables['members']} SET wordpress_id = 0 ` + where({ member_id: member_id }));
}

const members_create = (parms) => {
    var args = { active: 1, format: 1, ical: 1, noemail: 0, wordpress_id: 0 };
    var result;
    for (let key in parms) {
        args[key] = parms[key];
    }
    if (!('web_key' in args)) {
        args['web_key'] = generate_web_key();
    }
    if (!('member_id' in args)) {
        result = selectItem(`SELECT COALESCE(MAX(member_id), 0) + 1 AS member_id FROM ${tables['members']}`);
    } else {
        result = cy.wrap(parms['member_id']);
    }
    return result.then((member_id) => {
        args['member_id'] = member_id;
        return execute(insert(tables['members'], args)).then(() => {
            return member_id
        });
    });
}

const members_delete = (parms) => {
    return execute(`DELETE FROM ${tables['members']}` + where(parms));
}

const members_find = (parms) => {
    return selectRow(`SELECT * FROM ${tables['members']}` + where(parms));
}

const members_set = (member_id, parms) => {
    return execute(`UPDATE ${tables['members']} ` + set(parms) + where({ member_id: member_id }));
}

const members = {
    clear_wordpress_id: members_clear_wordpress_id,
    create: members_create,
    delete: members_delete,
    find: members_find,
    set: members_set
};

/** options functions */

const options_get = (option_name, use_default = '') => {
    let promise = selectItem(`SELECT option_value FROM ${tables['options']}` + where({ option_name: option_name }));
    return promise.then((value) => {
        return cy.wrap(value ? value : use_default);
    });
}

const options = {
    get: options_get
};

/** participants functions */

const participants_delete = (parms) => {
    return execute(`DELETE FROM ${tables['participants']}` + where(parms));
};

const participants_invite = (event_id, group_id) => {
    return execute(
        `INSERT INTO ${tables['participants']} (event_id, member_id, rsvp, waiting) ` +
        `SELECT '${event_id}', member_id, 0, 0 ` +
        `FROM ${tables['members']} ` +
        `WHERE member_id in (` +
        `SELECT member_id ` +
        `FROM ${tables['groupmembers']} ` +
        `WHERE group_id = ${group_id} AND ${tables['members']}.member_id = member_id)`);
};

const participants = {
    participants_delete,
    participants_invite
};

/** rsvps functions */

const rsvps_delete = (parms) => {
    return execute(`DELETE FROM ${tables['rsvps']}` + where(parms));
};

const rsvps = {
    rsvps_delete
};

/** users and usermeta functions */

const usermeta_delete = (parms) => {
    return execute(`DELETE FROM ${tables['usermeta']}` + where(parms));
};

const usermeta = {
    delete: usermeta_delete
};

const users_delete = (parms) => {
    select(`SELECT ID FROM ${tables['users']}` + where(parms))
        .then((rows) => {
            var wordpress_ids = [];
            rows.forEach((row) => {
                wordpress_ids.push(row.ID);
            });
            if (rows.length == 0) {
                return null;
            }
            return execute(`DELETE FROM ${tables['usermeta']} WHERE user_id in (`
                + wordpress_ids.join(',') + `)`);
        });

    users_get_id(parms).then(wordpress_id => {
        if (wordpress_id) {
            usermeta_delete({ user_id: wordpress_id });
        }
    });
    return execute(`DELETE FROM ${tables['users']}` + where(parms));
};

const users_delete_member = (login) => {
    users_get_id({ user_login: login })
        .then((wordpress_id) => {
            if (wordpress_id) {
                members_delete({ wordpress_id: wordpress_id });
            }
        })
};

const users_get_id = (parms) => {
    return selectItem(`SELECT ID FROM ${tables['users']}` + where(parms));
};

const users = {
    delete: users_delete,
    delete_member: users_delete_member,
    get_id: users_get_id
};

module.exports = {
    // utility functions
    generate_web_key,
    table_exists,

    // modules
    authors,
    books,
    events,
    groupmembers,
    members,
    options,
    participants,
    rsvps,
    usermeta,
    users
}
