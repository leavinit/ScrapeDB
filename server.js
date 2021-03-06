//for deployment (hides sensitive login for db etc)
require('dotenv').config()

//routing/db/pagefetcher/scraping
var express = require("express");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

//Models need to be listed in /models/index.js
var db = require("./models");
var PORT = process.env.PORT || 8888;
var app = express();

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//for static html,js,etc on the client side
app.use(express.static("public"));

// Connect the database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scrapedArticlesDB";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// Handlebars templating engine
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");


/////// Routing ///////

// Main route to display site
app.get("/", (req,res)=>{
    // console.log("at / route");
   res.render("index"); 
});
// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
//   axios.get("http://www.echojs.com/").then(function(response) {
    axios.get("https://www.npr.org/sections/news/").then(function(response) {

    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function(i, element) {
        // Save an empty result object
        var result = {};

        // Add the text and href of every link, and save them as properties of the result object
        result.title = $(this)
            .children("a")
            .text();
        result.link = $(this)
            .children("a")
            .attr("href");
        result.summary = $(this).parent().find("p.teaser > a").text();

        if(!result){console.log("null result before db check") }
        if(result == ""){
            console.log("empty title before db check")
        }
        // console.log("result before findone "+result.title);
        //Check the database (by title) to see if article already is stored
        db.Article.findOne({ title: result.title })
        .then(function(dbArticle) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            // res.json(dbArticle);
            if(dbArticle  && (dbArticle!= "")){
                console.log("Article found in database: "+dbArticle.title);
                return true;
            }else return false;
        })
        .then(function(found){
            //if article found 
            if (found) {
                console.log("No action needed.")
            }else{
                // Create a new Article using the `result` object built from scraping
                
                db.Article.create(result)
                    .then(function(dbArticle) {
                // View the added result in the console
                    //console.log(dbArticle);
                    console.log("new article created after scraping : "+dbArticle.title)
                }).catch(function(err){
                    console.log(err);
                });
            }
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, {$push: {note: dbNote._id }}, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

//Route for deleteing a particular note 
app.delete('/articles/:id/:noteid', function (req, res) {
    console.log("delete request for id: "+req.params.id)
    console.log("with noteid: "+req.params.noteid);
    //ridiculous amt of testing/db recconfig happened here 8ish hrs :(
    // sample delete (1st _id would be article id)
    // collection.update(
    //     { _id: id },
    //     { $pull: { 'contact.phone': { number: '+1786543589455' } } }
    //   );
    // db.Article.findByIdAndUpdate(
    //     req.params.id, { $pull: { "note": { _id: req.params.linkId } } }, { safe: true, upsert: true });
    db.Note.remove({"_id" : req.params.noteid}, (data)=>{console.log(data)});
    // console.log(index);
        // db.Article.friends.splice(index, 1);
        // db.Article.save();

    // db.Article.update( {"_id" : mongoose.Types.ObjectId(req.params.id) },{ $pull : { "note" : mongoose.Types.ObjectId(req.params.noteid) }});
    //   db.Article.update( {"_id" : req.params.id},{ $pull : { "note" : req.params.noteid }});
    //   db.Note.remove({"_id" : req.params.noteid});
      // return db.Article.update({ _id: ""+req.params.id }, {$pull: {_id: ""+req.params.noteid }}, { new: true });
  })
//   .then(function(data){
//     console.log(data);
// //     // res.send('Got a DELETE request at /articles/:id');
    
//   })
//   .catch(function(err) {
//     // If an error occurred, send it to the client
//     res.json(err);
//   });

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
