const express = require('express');
const { dirname } = require('path');
const app = require('express')();
const session = require('express-session')
const bodyParser = require('body-parser');
const siofu = require("socketio-file-upload");
const { setUserOnline, getUserBySocketId, getUserByUsername, userLeave } = require("./utils/user");
const { createChat, getChatPath, getChat, updateChat} = require('./utils/chat');
const formidable = require("formidable");
const { executeQuery } = require('./utils/sql');
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
app.set('views', __dirname+"/public");
app.use(session({
        resave: true, 
        saveUninitialized: true, 
        secret: 'somesecret', 
        cookie: { maxAge: 6000000 }
    })
);

//tạo web server
var http = require('http').createServer(app);

//tạo socketio server 
var io = require('socket.io')(http);

// start web servers
const PORT = process.env.PORT || 3000;
http.listen(PORT, err => {
    if (err) console.log("ERROR:" + err)
    console.log("Server running at:" + PORT);
});

app.get('/home', (req, res)=>{
    //check session
    if(typeof req.session.user !== "undefined" && req.session.user !== null){
        let user = req.session.user;
        let sql = `SELECT * FROM chat WHERE user_1 LIKE '${user.username}' OR user_2 LIKE '${user.username}'`;
        executeQuery(sql)
            .then((result) =>{
                result.forEach(row => {
                    let destination = "";
                    if(user.username !== row.user_1)
                        destination = row.user_1;
                    else 
                        destination = row.user_2;
                    let sqlUser = `SELECT * FROM user WHERE username LIKE ${destination}`; 
                });
                res.render('home.ejs', {
                    name: user.name,
                    username: user.username,
                    avatar:  user.avatar
                });
            })
            .catch(err => console.error(err))
    }
    
    else{
        res.redirect("/login")
    }
});

app.get('/login', (req, res)=>{
    res.render('login.html');
});

app.post('/login', (req, res)=>{
    let username = req.body.username;
    let password = req.body.password;
    let sql = `SELECT * FROM user WHERE username LIKE ? and password LIKE ? `

    executeQuery(sql, [username, password])
        .then(result =>{
            req.session.user = result[0]
            res.redirect('/home');
        })
        .catch(err => console.error(err))
});

app.get('/register', (req, res)=>{
    res.render('register.html');
});

app.post('/register', (req, res)=>{
    let path = "";
    let form = new formidable.IncomingForm();
    form.uploadDir = "public/img/avatar/";
    
    form.parse(req, (err, fields, files) => {
        if (err) throw err;
        let name = fields.name;
        let username = fields.username;
        let password = fields.password;
        let tmpPath = files.avatar.path;
        path = files.avatar.path + files.avatar.name;
        fs.rename(tmpPath, path, (err) => {
            if (err) throw err;
            let img =  path.split("public/")[1];
            let sql = `INSERT INTO user(name, username, password, avatar) VALUES( ?, ?, ?, ?)`;
            executeQuery(sql, [name, username, password, img])
                .then(() =>{
                    res.redirect('/login');
                })
                .catch(err => console.error(err))
        });
    });
});

app.get('/file/:folder/:fileName', (req, res) =>{
    res.download(`uploads/${req.params.folder}/${req.params.fileName}`);
})

let listUserOnline = []
// client connect
io.on('connection', (socket)=> {

    let uploader = new siofu();
    uploader.listen(socket);

    // lắng nghe client gửi dữ liệu ở event tên message
    socket.on("message", async function(data) {
        let sender = getUserBySocketId(socket.id).user;
        let receiver = getUserByUsername(data.sendto);
        let refomatData = {
            from: sender.username,
            type: 'message',
            message: data.message
        }; 
        let chatPath = await getChatPath(sender.username, data.sendto);

        if(chatPath === ''){
            chatPath = `chat/${sender.username}_${data.sendto}_${Date.now()}.txt`
            createChat(sender.username, data.sendto, chatPath, refomatData);
        }
        else{
            updateChat(chatPath, refomatData)
        }
        if(receiver){
            receiver.socket.emit("message", refomatData);
        }
    });

    socket.on("upload file",async data =>{
        let sender = getUserBySocketId(socket.id).user;
        let receiver = getUserByUsername(data.sendto);
        let refomatData = {
            from: sender.username,
            type: data.type,
            filename: data.filename
        }; 
        let chatPath = await getChatPath(sender.username, data.sendto);

        let tmpSplit = chatPath.split("/")[1].split("_");
        let uploadDir;
        if(tmpSplit.length == 3)
            uploadDir = `${tmpSplit[0]}_${tmpSplit[1]}`
        else{
            uploadDir = `${tmpSplit[0]}_${Date.now()}`
        }
        let path = makeFolderUpload(uploadDir);
        uploader.dir = path;
        uploader.on("complete", file => {
            let filePath = file.file.pathName;
            let fileName = filePath.replace('uploads/', '');
            refomatData.message = fileName;
            if(chatPath === ''){
                chatPath = `chat/${sender.username}_${data.sendto}_${Date.now()}.txt`
                createChat(sender.username, data.sendto, chatPath, refomatData);
            }
            else{
                updateChat(chatPath, refomatData);
                console.log(refomatData)
            }
            if(receiver){
                let coppyMessage = JSON.parse(JSON.stringify(refomatData));
                coppyMessage.message = `/file/${coppyMessage.message}`;
                console.log(coppyMessage)
                receiver.socket.emit("message", coppyMessage);
            }
        })
    })

    socket.on("get chat", async function(username) {
        let user1 = getUserBySocketId(socket.id).user.username;
        let user2 = username;
        let chatPath = await getChatPath(user1, user2);
        if(chatPath === ''){
            chatPath = `chat/${user1}_${user2}_${Date.now()}.txt`
            createChat(user1, user2, chatPath);
        }
        let chatHistory = getChat(chatPath);
        let refomatData = chatHistory.map(raw =>{
            if(raw.message){
                let line = JSON.parse(JSON.stringify(raw));
                if(line.type !== 'message'){
                    line.message = `/file/${line.message}`;
                }
                return line;
            }
            return raw;
        })
        socket.emit("get chat", refomatData)
    });

    socket.on("login", users => {
        listUserOnline = setUserOnline(socket.id, users, socket);
        let tmp = listUserOnline.map(u => u.user);
        socket.emit("update online", tmp);
        socket.broadcast.emit("update online", tmp);
    }) 

    socket.on("disconnect", (reason) =>{
        console.log(reason);
        listUserOnline = userLeave(socket.id);
        if(listUserOnline){
            let tmp = listUserOnline.map(u => u.user);
            socket.broadcast.emit("update online", tmp);
        }
    })

    socket.on('error', (error) => {
        console.log(error)
    });
})