/* eslint-disable no-case-declarations */
/* eslint-disable no-undef */
/* eslint-disable indent */
/* eslint-disable no-console */
const socket = io();
const onlineBox = document.getElementById('online-box');
let currentChatWidth = '';
const chatArea = document.querySelector('.chat-area');
const txtMessage = document.getElementById('txt-message');

function openChat(username, avatar) {
    currentChatWidth = username;
    socket.emit('get chat', currentChatWidth);
    const usernames = document.querySelectorAll('.chat-to-username');
    const img = document.getElementById('chat-to-avatar');
    usernames.forEach((e) => (e.innerText = username));
    img.setAttribute('src', avatar);
    chatArea.innerHTML = '';
}

function outputMessage(message, type = 'message', isSend = true, fileName) {
    const div = document.createElement('div');
    div.classList.add(['message-line']);
    const divChild = document.createElement('div');
    divChild.classList.add('message');
    if (isSend) divChild.classList.add('right');
    switch (type) {
        case 'message':
            divChild.innerText = message;
            break;
        case 'image':
            const img = document.createElement('img');
            img.src = message;
            divChild.classList.add('non-background');
            divChild.appendChild(img);
            break;
        case 'video':
            const video = document.createElement('video');
            const source = document.createElement('source');
            source.setAttribute('type', 'video/mp4');
            source.src = message;
            video.setAttribute('controls', 'true');
            video.appendChild(source);
            divChild.classList.add('non-background');
            divChild.appendChild(video);
            break;
        default:
            const a = document.createElement('a');
            a.setAttribute('target', '_blank');
            a.innerText = fileName;
            a.href = message;
            divChild.appendChild(a);
            break;
    }
    div.appendChild(divChild);
    chatArea.appendChild(div);
}

function onLoadedFile() {
    const selector = document.getElementById('file-input');
    const file = selector.files[0];
    const reader = new FileReader();
    const uploader = new SocketIOFileUpload(socket);

    const type = file.type.split('/')[0];
    reader.onload = (e) => {
        outputMessage(e.target.result, type);
    };

    const data = {
        sendto: currentChatWidth,
        type,
        filename: file.name,
    };
    socket.emit('upload file', data);
    uploader.submitFiles(selector.files);

    reader.readAsDataURL(file);
}

document.getElementById('file-input').addEventListener('change', () => {
    onLoadedFile();
});

const user = {
    username: document.getElementById('my-username').innerText,
    avatar: document.getElementById('my-avatar').getAttribute('src'),
};

// xử lý sự kiện click của nút gửi
document.getElementById('btn-send').onclick = () => {
    // lấy giá trị trong ô input
    const message = txtMessage.value;
    txtMessage.value = '';
    const data = {
        sendto: currentChatWidth,
        type: 'message',
        message,
    };
    socket.emit('message', data);
    outputMessage(message);
};

socket.emit('login', user);

socket.on('disconnect', (reason) => {
    console.log(reason);
});

socket.on('error', (error) => {
    console.log(error);
});

// nhận dữ liệu
socket.on('message', (data) => {
    if (data.from === currentChatWidth) {
        outputMessage(data.message, data.type, false, data.filename);
    }
});

socket.on('update online', (data) => {
    onlineBox.innerHTML = '';
    data.forEach((e) => {
        const img = document.createElement('img');
        img.setAttribute('src', e.avatar);
        img.title = e.username;
        img.setAttribute('data-bs-placement', 'bottom');
        img.setAttribute('data-toggle', 'tooltip');
        img.classList.add('online-user');
        img.title = e.username;
        // eslint-disable-next-line no-new
        new bootstrap.Tooltip(img);
        onlineBox.appendChild(img);
        img.onclick = () => openChat(e.username, e.avatar);
    });
});

socket.on('get chat', (data) => {
    data.forEach((line) => {
        outputMessage(
            line.message,
            line.type,
            line.from !== currentChatWidth,
            line.filename,
        );
    });
});
