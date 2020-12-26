/* eslint-disable no-console */
/* eslint-disable indent */
const fs = require('fs');
const { executeQuery } = require('./sql');

function getChat(path) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function createChat(user1, user2, path, reformatData = '') {
    const sql = 'INSERT INTO chat(user_1, user_2, log_path, last_message) VALUES (?, ?, ?, ?)';
    executeQuery(sql, [
        user1,
        user2,
        path,
        JSON.stringify(reformatData),
    ]).catch((err) => console.error(err));
    console.log(`Create new file ${path}`);

    return getChat(path);
}

function updateLastMessageToDB(path, message) {
    const sql = 'UPDATE chat SET last_message = ? WHERE log_path = ?';
    executeQuery(sql, [message, path]).catch((err) => console.error(err));
}

async function getChatPath(user1, user2) {
    const sql = 'SELECT * FROM chat WHERE (user_1 LIKE ? AND user_2 LIKE ?) OR (user_1 LIKE ? AND user_2 LIKE ?)';
    const result = await executeQuery(sql, [user1, user2, user2, user1]);
    if (result.length === 0) return '';
    return result[0].log_path;
}

function updateChat(path, data) {
    const chatHistory = getChat(path);
    chatHistory.push(data);
    updateLastMessageToDB(path, JSON.stringify(data));
    fs.writeFile(path, JSON.stringify(chatHistory), (err) => console.error(err));
}

module.exports = {
    createChat,
    getChatPath,
    getChat,
    updateChat,
};
