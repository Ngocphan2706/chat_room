const socket = io();

// xử lý sự kiện click của nút gửi
$(document).ready(() =>{
    $("#btn-send").click( function(e){
        //lấy giá trị trong ô input
        let message =  $('#txt-message').val();
        
        //gửi nội dung từ ô input đến server qua sự kiện "ßmessasge" 
        socket.emit("message" , message)

        $(".chat-area").append(`
            <div class="message-line">
                <div class="message right">`
                +message+     
                `</div>
            </div>
        `)

        $('#txt-message').val("")
    
    });

    document.getElementById("image-input").addEventListener("change", function(){
        
		onLoadedImage();
	});
})


   // nhận dữ liệu
socket.on("chat", message =>{
    $(".chat-area").append(`
            <div class="message-line">
                <div class="message">`
                +message+     
                `</div>
            </div>
        `)
})

function onLoadedImage(){
    console.log("alo alo")
	var selector = document.getElementById("image-input");
	var img = document.createElement("img");

	var reader = new FileReader();
        reader.onload = function (e) {
            img.src = e.target.result;
            $(".chat-area").append(`
                <div class="message-line">
                    <div class="message non-background right">`
                    +img.outerHTML+     
                    `</div>
                </div>
            `)
            socket.emit("message", img.outerHTML);
        }
 	reader.readAsDataURL(selector.files[0]);
}