const socket = io();
let onlineBox = document.getElementById('online-box');
let currentChatWidth = '';
let chatArea = document.querySelector('.chat-area');
let txtMessage = document.getElementById('txt-message');
// xử lý sự kiện click của nút gửi
document.getElementById("btn-send").onclick = function(e){
    //lấy giá trị trong ô input
    let message =  txtMessage.value;
    txtMessage.value = "";
    let data = {
        sendto: currentChatWidth,
        type: 'message',
        message: message 
    }
    socket.emit("message" , data)
    outputMessage(message)
};

// nhận dữ liệu
socket.on("message", data =>{
    console.log(data);
    if(data.from === currentChatWidth)
        outputMessage(data.message, data.type, false, data.filename);
})

socket.on("update online", data =>{
    onlineBox.innerHTML  = '';
    data.forEach(e => {
        let img = document.createElement('img');
        img.setAttribute('src', e.avatar);
        img.title  = e.username;
        img.setAttribute('data-bs-placement', "bottom");
        img.setAttribute('data-toggle', "tooltip");
        img.classList.add("online-user");
        img.title  = e.username;
        let tooltip = new bootstrap.Tooltip(img)
        onlineBox.appendChild(img)
        img.onclick = (event) => openChat(e.username, e.avatar)
    });
})

socket.on("get chat", data =>{
    data.forEach(line =>{
        outputMessage(line.message, line.type, line.from !== currentChatWidth, line.filename)
    })
})

socket.on('disconnect', (reason) => {
    console.log(reason)
});

socket.on('error', (error) => {
    console.log(error)
});

function openChat(username, avatar){
    currentChatWidth = username;
    socket.emit("get chat", currentChatWidth);
    let usernames = document.querySelectorAll('.chat-to-username');
    let img= document.getElementById("chat-to-avatar");
    usernames.forEach( e => e.innerText = username);
    img.setAttribute("src", avatar);
    chatArea.innerHTML="";
}

function sendMessage(destinaion, message){
    let data = {
        receiver: destinaion,
        message: message
    }
    socket.emit("message", data)
}

function outputMessage(message, type = 'message', isSend = true, fileName) {
    const div = document.createElement('div');
    div.classList.add(['message-line']);
    const divChild = document.createElement('div');
    divChild.classList.add('message');
    if(isSend) divChild.classList.add('right');
    switch (type) {
        case 'message':
            divChild.innerText = message;
            break;
        case 'image':
            let img = document.createElement("img");
            img.src = message;
            divChild.classList.add('non-background')
            divChild.appendChild(img)
            break;
        case 'video':
            let video = document.createElement('video');
            let source = document.createElement('source')
            source.setAttribute('type', 'video/mp4')
            source.src = message;
            video.setAttribute('controls', 'true');
            video.appendChild(source);
            divChild.classList.add('non-background')
            divChild.appendChild(video);
            break;
        default:
            let a = document.createElement('a');
            a.setAttribute("target", "_blank");
            a.innerText = fileName;
            a.href = message;
            divChild.appendChild(a);
            break;
    }
    div.appendChild(divChild);
    chatArea.appendChild(div);
}

function onLoadedFile(e){
    let selector = document.getElementById("file-input");
    let file = selector.files[0];
    let reader = new FileReader();
    let uploader = new SocketIOFileUpload(socket);
    
    let type = file.type.split("/")[0]
    reader.onload = function (e) {
        outputMessage(e.target.result, type)
    }

    let data = {
        sendto: currentChatWidth,
        type: type,
        filename: file.name,
    };
    socket.emit('upload file', data);
    uploader.submitFiles(selector.files);
    
 	reader.readAsDataURL(file);
}

document.getElementById("file-input").addEventListener("change", function(e){
    onLoadedFile(e);
});

let user  = {
    username: document.getElementById("my-username").innerText,
    avatar: document.getElementById("my-avatar").getAttribute('src')
};

socket.emit("login", user);