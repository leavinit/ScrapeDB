  //hide the notes section (until article is clicked)
  $("#notes").hide();
  

  //handle the get news button
  $("#scrapeButton").click(function(e){
      e.preventDefault();
      $.ajax({
          method: "GET",
          url: "/scrape"
      })
      .then(function(){
          // Grab the articles as a json
        $.getJSON("/articles", function(data) {
            // For each one
            for (var i = 0; i < data.length; i++) {
            // Display the apropos information on the page
            $("#articles").append("<p class='article' data-id='" + data[i]._id + "'>" + data[i].title + "<br />" + data[i].link +
            "<br />" + data[i].summary + "</br></br></p>");
            }
                    //Hightlight p tags on mouseover
  
            $(".article").hover(function() { 
                $(this).css("border", "4px solid green"); 
            }, function() { 
                $(this).css("border", "none"); 
            }); 
        });

      });

  });
  // Whenever someone clicks a p tag
  $(document).on("click", "p", function() {
    // Empty the notes from the note section
  
    $("#notes").empty();
  
    // Save the id from the p tag
    var thisId = $(this).attr("data-id");
  
    // Now make an ajax call for the Article
    $.ajax({
      method: "GET",
      url: "/articles/" + thisId
    })
      // With that done, add the note information to the page
      .then(function(data) {
        console.log(data);
        // The title of the article
        $("#notes").append("<h2>" + data.title + "</h2>");
        // An input to enter a new title
        $("#notes").append("<input id='titleinput' name='title' >");
        // A textarea to add a new note body
        $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
        // A button to submit a new note, with the id of the article saved to it
        $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");
        $("#notesInput").append("<button id='addNewNote'>New Note</button>");
  
        // If there's a note in the article
        if (data.note) {
            
            for(let i=0;i < data.note.length;i++){
                console.log(data.note[i]._id);
                // Place the title of the note in the title input
                // Place the body of the note in the body textarea
                $("#notes").append(
                    "</br><div class='noteText' data-id="+data._id+
                    " data-note-id="+data.note[i]._id+">NOTE"+i
                    + "TITLE: "+data.note[i].title + "</br>"
                    +"NOTE: "+data.note[i].body+
                    "<button class='noteButton'>X</button></br></br>"
                    +"</div>");
                // console.log (i+ " : iteration : " + data.note[i].title);
            }
            //finally show the note
            $("#notes").show();
        }
      });
  });
  
  // When you click the savenote button
  $(document).on("click", "#savenote", function() {
    // Grab the id associated with the article from the submit button
    var thisId = $(this).attr("data-id");
  
    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
      method: "POST",
      url: "/articles/" + thisId,
      data: {
        // Value taken from title input
        title: $("#titleinput").val(),
        // Value taken from note textarea
        body: $("#bodyinput").val()
      }
    })
      // With that done
      .then(function(data) {
        // Log the response
        console.log(data);
        // Empty the notes section
        $("#notes").empty();
      });
  
    // Also, remove the values entered in the input and textarea for note entry
    $("#titleinput").val("");
    $("#bodyinput").val("");
  });
  

  //When you click a note delete button
  $(document).on("click", ".noteButton ", function() {
        console.log("/articles/" + $(this).parent().attr("data-id")+"/"+$(this).parent().attr("data-note-id"));
        event.stopPropagation();
        event.stopImmediatePropagation();
        //delete the note's div
        articleId =  $(this).parent().attr("data-id");
        noteId = $(this).parent().attr("data-note-id");
        // console.log("deleting note: "+$(this).text())
        // console.log("with id: "+$(this).attr("data-id"))

        // Remove the note
        $(this).parent().empty();
        
        // Run a POST request to change the note, using what's entered in the inputs
        $.ajax({
            method: "DELETE",
            url: "/articles/" +articleId +"/"+ noteId
            
            // data: {
            // // Value taken from title input
            // title: $("#titleinput").val(),
            // // Value taken from note textarea
            // body: $("#bodyinput").val()
            // }
        }).then(function(data){
            console.log("Returned from delete request"+data)
            
        })
  
    });