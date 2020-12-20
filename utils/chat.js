const fs = require('fs');
const { executeQuery } = require('./sql');


function createChat(user1, user2, path, refomatData  = "") {
    // if(refomatData === ""){
    //     // refomatData = {
    //     //     from: user1,
    //     //     type: 'message',
    //     //     message: ""
    //     // }
    // }
    let file = fs.writeFileSync(path, "[]");
    let  sql = `INSERT INTO chat(user_1, user_2, log_path, last_message) VALUES (?, ?, ?, ?)`;
    executeQuery(sql, [user1, user2, path, JSON.stringify(refomatData)])
        .catch(err => console.error(err))
    console.log(`Create new file ${path}`);
    
    return getChat(path);
}

function getChat(path) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function updateLastMessageToDB(path, message){
    let sql = `UPDATE chat SET last_message = ? WHERE log_path = ?`;
    executeQuery(sql, [message, path])
        .catch(err => console.error(err));
}

async function getChatPath(user1, user2) {
    let sql = "SELECT * FROM chat WHERE (user_1 LIKE ? AND user_2 LIKE ?) OR (user_1 LIKE ? AND user_2 LIKE ?)";
    let result = await executeQuery(sql, [user1, user2, user2, user1]);
    if(result.length === 0)
        return '';
    else
        return result[0].log_path
}

function updateChat(path, data) {
    let chatHistory = getChat(path);
    chatHistory.push(data);
    updateLastMessageToDB(path, JSON.stringify(data))
    fs.writeFile(path, JSON.stringify(chatHistory), (err) =>  console.error(err));
}

module.exports = {
    createChat,
    getChatPath,
    getChat,
    updateChat
}