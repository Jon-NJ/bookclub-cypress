const mysql = require('mysql');
const fs = require('fs');

let connection = null;

function connect(config) {
    if (!connection) {
        // console.log('check db property');
        connection = mysql.createConnection(config.env.db);
        // console.log('log property found');
        connection.connect();
    }
}

function disconnect() {
    connection.end();
    connection = null;
}

function query(sql, config) {
    connect(config);
    console.log(sql);
    return new Promise((resolve, reject) => {
        connection.query(sql, (error, results) => {
            if (error) reject(error);
            else {
                // console.log(results);
                return resolve(results);
            }
        });
    });
}

async function select(sql, config) {
    const result = await query(sql, config);
    return result;
}

async function selectItem(sql, config) {
    const result = await query(sql, config);
    if (result.length) {
        for (var first in result[0]) break;
        // console.log(first, result[0][first]);
        return result[0][first];
    }
    return null;
}

async function selectRow(sql, config) {
    const result = await query(sql, config);
    // console.log(JSON.stringify(result[0]));
    return result.length ? result[0] : null;
}

async function execute(sql, config) {
    await query(sql, config);
    return null;
}

async function execute_script(filename, config) {
    let contents = fs.readFileSync(filename, { encoding: 'utf8', flag: 'r' });
    let sqls = contents.split(/;\s(\r\n)/);
    for (let i = 0; i < sqls.length; ++i) {
        await query(sqls[i], config);
    }
    return null;
}

// async function execute_script(sql, config) {
//     await query(sql, config);
//     return null;
// }

async function exists(table, config) {
    const result = await query(`SHOW TABLES LIKE '${table}'`, config);
    return result.length;
}

module.exports.tasks = (on, config) => {
    on('task', {
        // 'db:script': (sql) => {
        //     return execute_script(sql, config);
        // },
        'db:script': (filename, config) => {
            return execute_script(filename, config);
        },
        'db:selectItem': (sql) => {
            return selectItem(sql, config);
        },
        'db:selectRow': (sql) => {
            return selectRow(sql, config);
        },
        'db:select': (sql) => {
            return select(sql, config);
        },
        'db:execute': (sql) => {
            return execute(sql, config);
        },
        'db:exists': (table) => {
            return exists(table, config);
        },
        'db:disconnect': () => {
            disconnect();
            return null;
        }
    })
}
