/* eslint-disable indent */
const mysql = require('mysql');

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '87654321',
    database: 'chatroom',
});
con.connect((err) => {
    if (err) throw err;
});

function executeQuery(query, data = []) {
    return new Promise((resolve, reject) => {
        if (data.length === 0) {
            con.query(query, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        } else {
            con.query(query, data, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        }
    });
}

module.exports = {
    executeQuery,
};
