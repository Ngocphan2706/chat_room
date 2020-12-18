const express = require('express');
const { dirname } = require('path');
var app = require('express')();
var session = require('express-session')
var bodyParser = require('body-parser');
var mysql = require('mysql');
var siofu = require("socketio-file-upload");

app.use(bodyParser.json());
app.use(siofu.router);
app.use(bodyParser.urlencoded({ extended: true }));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname+"/public");
app.use(session({
        resave: true, 
        saveUninitialized: true, 
        secret: 'somesecret', 
        cookie: { maxAge: 600000 }
    })
);

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "12345678",
    database: "chatroom"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!!!")
});

onlineUserList = []
onlineSocketList = []

//tạo web server
var http = require('http').createServer(app);

//tạo socketio server 
var io = require('socket.io')(http);

// start web servers
const PORT = process.env.PORT || 3000;
http.listen(PORT, err => {
    if (err) console.log("ERROR:" + err)
    console.log("Server runnibg:" + PORT);
});

app.use(express.static('public')); // để khai báo thư mục 
app.get('/home', (req, res)=>{
    if(typeof req.session.user !== "undefined" && req.session.user !== null){
        res.render('home.html', {name: req.session.user.name, username:req.session.user.username, img: req.session.user.img});
    }
    else{
        res.redirect("/login")
    }
        
});

app.get('/login', (req, res)=>{
    res.sendFile(__dirname + '/public/login.html');
});

app.post('/login', (req, res)=>{
    let username = req.body.username;
    let password = req.body.password;
    let sql = `SELECT * FROM user WHERE username LIKE '${username}' and password LIKE '${password}' `

    con.query(sql, (err, result) =>{
        if(err) res.send(err)
        else {
            req.session.user = {
                id: result[0].id,
                name: result[0].name,
                username: result[0].username,
                img: result[0].avatar
            }
            onlineUserList[result[0].username] = result[0]
            res.redirect('/home');
        }
        
    })
});

app.get('/register', (req, res)=>{
    res.sendFile(__dirname + '/public/register.html');
});

app.post('/register', (req, res)=>{
    let name = req.body.name;
    let username = req.body.username;
    let password = req.body.password;
    let confirmPassword = req.body.password2;

    let sql = `INSERT INTO user(name, username, password) VALUES( '${name}', '${username}', '${password}')`

    con.query(sql, (err, result) =>{
        if(err) res.send(err)
        else res.redirect('/login');
    })
});

app.post('/get-chat-info', (req, res) => {
    let receiver = req.body.username;
    let sender = req.session.user.username;

    let sql = "SELECT * FROM chat WHERE (user_1 LIKE ? AND user_2 LIKE ?) OR (user_1 LIKE ? AND user_2 LIKE ?)";
    con.query(sql, [sender, receiver, receiver, sender], (err, result) =>{
        if(err) res.send(err)
        else{
            console.log(result)
        }
    })
})
// sự kiên lắng nghe client connect
io.on('connection', (socket)=> {
    console.log(socket.id + " connected!!"); 

    // lắng nghe client gửi dữ liệu ở event tên message
    socket.on("message", (message) => {
        
    })

    socket.on("login", username => {
        onlineSocketList[username] = {
            "id" : socket.id,
            "socket": socket,
        }
    }) 

    socket.broadcast.emit("update_online", "onlineUserList")
})