/* eslint-disable indent */
const users = [];

// add online user
function setUserOnline(id, user, socket) {
    const u = { id, user, socket };
    users.push(u);
    return users;
}

// Get current user
function getUserBySocketId(id) {
    return users.find((user) => user.id === id);
}

function getUserByUsername(username) {
    return users.find((u) => u.user.username === username);
}

// User leaves chat
// eslint-disable-next-line consistent-return
function userLeave(id) {
    const index = users.findIndex((user) => user.id === id);

    if (index !== -1) {
        users.splice(index, 1);
        return users;
    }
}

module.exports = {
    setUserOnline,
    getUserBySocketId,
    getUserByUsername,
    userLeave,
};
