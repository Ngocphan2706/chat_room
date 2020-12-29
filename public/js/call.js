const socket = io();
const peer = new Peer(); 
const username = document.getElementById("my-username").name;
const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
const carousel = document.querySelector(".owl-carousel");
let playing = document.getElementById("playing-video");
let lastUserJoin = "";
let localStream = null;
getUserMedia({video: true, audio: true}, stream => localStream = stream)
peer.on("open", () => {
    const info = {
        username,
        id: peer.id
    };

    socket.emit("init call", info);

    document.getElementById('local-video').srcObject = localStream; 
})

//button
function setoff(){
    document.getElementById("on").style.display = 'none';
    document.getElementById("off").style.display = 'block';
    localStream.getVideoTracks()[0].enabled=false
    console.log(localStream.getVideoTracks()[0])
}
function seton(){
    document.getElementById("off").style.display = 'none';
    document.getElementById("on").style.display = 'block';
    localStream.getVideoTracks()[0].enabled=true
    console.log(localStream.getTracks()[0])
}
function micon(){
    document.getElementById("micon").style.display = 'none';
    document.getElementById("micoff").style.display = 'block';
    localStream.getAudioTracks()[0].enabled = false;
    console.log(localStream.getAudioTracks()[0])
}
function micoff(){
    document.getElementById("micoff").style.display = 'none';
    document.getElementById("micon").style.display = 'block';
   localStream.getAudioTracks()[0].enabled = true;
    console.log(localStream.getTracks()[0])
}

socket.on('init call', listMember => {
    console.log(listMember)
    listMember.forEach(member => {
        let call = peer.call(member.id, localStream);
        call.on('stream', function(remoteStream) {
            addVideoToDOM(remoteStream, member.username)
        });
    })
})

peer.on('call', call => {
    call.answer(localStream);
    call.on('stream',  function(remoteStream) {
        addVideoToDOM(remoteStream, lastUserJoin);
    });
} )
socket.on('user join', member => {
    lastUserJoin = member.username
})

socket.on("user leave", data =>{
    let users = document.querySelectorAll(".user-video");
    if(users)
        users.forEach((video, i) =>{
            if(video.id == data.username){
                $('.owl-carousel').owlCarousel('remove', i).owlCarousel('update');
            }
        })
})

function addVideoToDOM(remoteStream, username = "unset-video"){
    let video = document.getElementById(username);
        if(!video){
            video = document.createElement('video');
            video.classList.add("user-video")
            video.width = 320;
            video.height = 240;
            video.autoplay = true;
            video.id = username;
            video.srcObject = remoteStream;
            $('.owl-carousel').owlCarousel('add', video).owlCarousel('update');
            video.onclick = () =>{
                playing.srcObject = remoteStream;
            }
        }
}