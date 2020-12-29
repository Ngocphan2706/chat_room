/* eslint-disable new-cap */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-console */
/* eslint-disable indent */
const express = require('express');
const fs = require('fs');
const app = require('express')();
const httpApp = require('http');
const socketIO = require('socket.io');
const session = require('express-session');
// const { Peer } = require("peerjs"
const bodyParser = require('body-parser');
const siofu = require('socketio-file-upload');
const formidable = require('formidable');
const { renderFile } = require('ejs').renderFile;
const { executeQuery } = require('./utils/sql');
const {
    setUserOnline,
    getUserBySocketId,
    getUserByUsername,
    userLeave,
} = require('./utils/user');

const {
    createChat,
    getChatPath,
    getChat,
    updateChat,
} = require('./utils/chat');
const { query } = require('express');
const { type } = require('os');
const { makeFolderUpload, readFileAsBase64 } = require('./utils/upload-file')
const BASE_URL = 'http://localhost:3000'

app.use(bodyParser.json());
app.use(siofu.router);
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views', `${__dirname}/public`);
app.use(
    session({
        resave: true,
        saveUninitialized: true,
        secret: 'somesecret',
        cookie: { maxAge: 6000000 },
    }),
);

// tạo web server
const http = httpApp.createServer(app);

// tạo socketio server
const io = socketIO(http);

// start web servers
const PORT = process.env.PORT || 3000;
http.listen(PORT, (err) => {
    if (err) console.log(`ERROR:${err}`);
    console.log(`Server running at: ${PORT}`);
});

app.get('/home', (req, res) => {
    // check session
    if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
        const { user } = req.session;
        const sql = `SELECT * FROM chat WHERE user_1 LIKE '${user.username}' OR user_2 LIKE '${user.username}'`;
        executeQuery(sql)
            .then((result) => {
                result.forEach((row) => {
                    let destination = '';
                    if (user.username !== row.user_1) destination = row.user_1;
                    else destination = row.user_2;
                    const sqlUser = `SELECT * FROM user WHERE username LIKE ${destination}`;
                });
                res.render('home.ejs', {
                    name: user.name,
                    username: user.username,
                    avatar: user.avatar,
                });
            })
            .catch((err) => console.error(err));
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.render('login.html');
});

app.post('/login', (req, res) => {
    const { username } = req.body;
    const { password } = req.body;
    const sql = 'SELECT * FROM user WHERE username LIKE ? and password LIKE ? ';

    executeQuery(sql, [username, password])
        .then((result) => {
            req.session.user = result[0];
            res.redirect('/home');
        })
        .catch((err) => console.error(err));
});

app.get('/call', (req, res) => {
    if (typeof req.session.user !== 'undefined' && req.session.user !== null) {
        const { user } = req.session;
        const sql = `SELECT * FROM chat WHERE user_1 LIKE '${user.username}' OR user_2 LIKE '${user.username}'`;
        executeQuery(sql)
            .then((result) => {
                result.forEach((row) => {
                    let destination = '';
                    if (user.username !== row.user_1) destination = row.user_1;
                    else destination = row.user_2;
                    const sqlUser = `SELECT * FROM user WHERE username LIKE ${destination}`;
                });
                res.render('call.ejs', {
                    username: user.username,
                    avatar: user.avatar,
                });
            })
            .catch((err) => console.error(err));
    }
    else res.redirect('/login');
})

app.get('/register', (req, res) => {
    res.render('register.html');
});

app.post('/register', (req, res) => {
    let path = '';
    const form = new formidable.IncomingForm();
    form.uploadDir = 'public/img/avatar/';

    form.parse(req, (err, fields, files) => {
        if (err) throw err;
        const name = fields.name;
        const username = fields.username;
        const password = fields.password;
        const tmpPath = files.avatar.path;
        path = files.avatar.path + files.avatar.name;
        fs.rename(tmpPath, path, (error) => {
            if (error) console.log(error);
            const img = path.split('public/')[1];
            const sql = 'INSERT INTO user(name, username, password, avatar) VALUES( ?, ?, ?, ?)';
            executeQuery(sql, [name, username, password, img])
                .then(() => {
                    res.redirect('/login');
                })
                .catch((er) => console.error(er));
        });
    });
});

app.get('/file/:folder/:fileName', (req, res) => {
    res.download(`uploads/${req.params.folder}/${req.params.fileName}`);
});

let listUserOnline = [];
let roomMember = []
// client connect
io.on('connection', (socket) => {
    const uploader = new siofu();
    uploader.listen(socket);

    // lắng nghe client gửi dữ liệu ở event tên message
    socket.on('message', async (data) => {
        const sender = getUserBySocketId(socket.id).user;
        const receiver = getUserByUsername(data.sendto);
        const reformatData = {
            from: sender.username,
            type: 'message',
            message: data.message,
        };
        let chatPath = await getChatPath(sender.username, data.sendto);

        if (chatPath === '') {
            chatPath = `chat/${sender.username}_${
                data.sendto
            }_${Date.now()}.txt`;
            createChat(sender.username, data.sendto, chatPath, reformatData);
        } else {
            updateChat(chatPath, reformatData);
        }
        if (receiver) {
            receiver.socket.emit('message', reformatData);
        }
    });

    socket.on('upload file', async (data) => {
        const sender = getUserBySocketId(socket.id).user;
        const receiver = getUserByUsername(data.sendto);
        const reformatData = {
            from: sender.username,
            type: data.type,
            filename: data.filename,
        };
        let chatPath = await getChatPath(sender.username, data.sendto);

        const tmpSplit = chatPath.split('/')[1].split('_');
        let uploadDir;
        if (tmpSplit.length === 3) uploadDir = `${tmpSplit[0]}_${tmpSplit[1]}`;
        else {
            uploadDir = `${tmpSplit[0]}_${Date.now()}`;
        }
        const path = makeFolderUpload(uploadDir);
        uploader.dir = path;
        uploader.on('complete', (file) => {
            const filePath = file.file.pathName;
            const fileName = filePath.replace('uploads/', '');
            reformatData.message = fileName;
            if (chatPath === '') {
                chatPath = `chat/${sender.username}_${
                    data.sendto
                }_${Date.now()}.txt`;
                createChat(sender.username, data.sendto, chatPath, reformatData);
            } else {
                updateChat(chatPath, reformatData);
                console.log(reformatData);
            }
            if (receiver) {
                const copyMessage = JSON.parse(JSON.stringify(reformatData));
                copyMessage.message = `/file/${copyMessage.message}`;
                console.log(copyMessage);
                receiver.socket.emit('message', copyMessage);
            }
        });
    });

    socket.on('get chat', async (username) => {
        const user1 = getUserBySocketId(socket.id).user.username;
        const user2 = username;
        let chatPath = await getChatPath(user1, user2);
        if (chatPath === '') {
            chatPath = `chat/${user1}_${user2}_${Date.now()}.txt`;
            createChat(user1, user2, chatPath);
        }
        const chatHistory = getChat(chatPath);
        const reformatData = chatHistory.map((raw) => {
            if (raw.message) {
                const line = JSON.parse(JSON.stringify(raw));
                if (line.type !== 'message') {
                    line.message = `/file/${line.message}`;
                }
                return line;
            }
            return raw;
        });
        socket.emit('get chat', reformatData);
    });

    socket.on('login', (users) => {
        listUserOnline = setUserOnline(socket.id, users, socket);
        const tmp = listUserOnline.map((u) => u.user);
        socket.emit('update online', tmp);
        socket.broadcast.emit('update online', tmp);
    });

    socket.on('init call', (data) =>{
        io.to('call').emit('user join', data);
        socket.emit("init call", roomMember);
        socket.join('call');
        let roomer = {
            id: data.id,
            username: data.username,
            socketId: socket.id,
        }
        roomMember.push(roomer);
        
    })

    socket.on('disconnect', (reason) => {
        console.log(reason);
        listUserOnline = userLeave(socket.id);
        if (listUserOnline) {
            const tmp = listUserOnline.map((u) => u.user);
            socket.broadcast.emit('update online', tmp);
        }

        let leaveMember = null;
        let leaveMemberIndex = -1;
        roomMember = roomMember.filter((member, i) => {
            if(member.socketId === socket.id){
                leaveMember = member;
            }
            else return member
        });
        
        if (leaveMember){
            
            socket.to("call").emit("user leave", {
                username: leaveMember.username,
                id: leaveMember.id
            });
        }
    });

    socket.on('error', (error) => {
        console.log(error);
    });
});

