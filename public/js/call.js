const socket = io();
const isCaller = location.pathname.includes('call');

const peer = new SimplePeer({
    initiator: isCaller,
    trickle: false
});

peer.on('signal', data =>{
    console.log(JSON.stringify(data))
});
