$("#upload-btn").click(function(e) {
    var hi = "dd";
    alert("clicked on flash_holder");

    //show to sender itself the image


      //send to server

   socket.emit("uploaded", hi );

});

     socket.on('display uploaded img', function(fileserverpath) {
    /* ... */
        //$('#canvas').empty().append('<img src="/uploads/"'fileserverpath+' height="64px" width="64px">');
 //$('#canvas').attr('src','/uploads/'+fileserverpath);
    var fullpath = '/uploads/'+fileserverpath;

     // addChatMessage('<img src ="/uploads/'+fileserverpath+'" class="img-rounded img-responsive" id="canvas"></img>');

      message = "<img src ='/uploads/"+fileserverpath+"' class='img-rounded img-responsive' id='canvas'></img>";
        addChatMessage({
        username: username,
        message: message
      });

     socket.emit('message', message);

     console.log("cleints receves this from server");

    //$('mssages').prepend($('<img>',{id:'theImg',src: fullpath}))
  });
