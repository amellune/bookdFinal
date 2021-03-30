const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const bodyParser= require('body-parser'); //handles reading data from forms
const hbs = require('hbs'); //templating engine
var request = require('request');
var fs = require("fs");
const MongoClient = require('mongodb').MongoClient; //database
const objectId = require('mongodb').ObjectID;
var session = require('express-session');
const { response } = require('express');
const { createBrotliCompress } = require('zlib');
const { EWOULDBLOCK } = require('constants');
//const MongoStore = require("connect-mongo")(session);
var MongoDBStore = require('connect-mongodb-session')(session);


const app = express();



var url="mongodb+srv://corawan:admin@cluster0.palg8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
var db;

//connect to the MongoDB
MongoClient.connect(url, (err, client) => { //this is localhost connection string, for cloud drop the connection string, the localhost address: mongodb+srv://corawan:admin@cluster0.palg8.mongodb.net/test?authSource=admin&replicaSet=atlas-l4f3ow-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true
  if (err) return console.log(err);

  db = client.db('scent'); //Sets the database to work with


  //starts a server
  app.listen(3000, () => {
    console.log('listening on port 3000')
  })
})



app.use(session({
      key: "user_sid",
      secret: "secret",  //used to sign the session ID cookie
      resave: false,
      saveUninitialized: false,
      cookie: { //Object for the session ID cookie.
      expires: 600000,  //cookies on the browser for 6 days
      },
    })
  );

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('viewEngine', 'hbs' );


const redirectLogin = (req, res, next)=>{
    if(!req.session.userId){
        res.redirect('/login')
    }else{
        next()
    }
}

const redirectUpload = (req, res, next)=>{
    if(req.session.userId){
        res.redirect('/Upload')
    }else{
        next()
    }
}


//display the "landing page/sign in" form
app.get('/', (req, res) => {
      res.render('index.hbs'); //by default, hbs views are placed in a "views" folder
})

var sess; var thePassword; var theEmail; var user; var password;

app.get('/login', redirectUpload, (req, res) => {
    res.render('login.hbs'); //by default, hbs views are placed in a "views" folder
})

app.post('/login', redirectUpload, (req, res, next) => {

    theEmail = req.body.email;
    thePassword = req.body.password;

    // if (theUEmail === "" || thePassword === "") {
    //     res.render("/login", {
    //             errorMessage: "Please enter both, email and password to sign up."
    //  })};

    db.collection('user').find({email: theEmail})
    .next()
    .then(user => {
        console.log(user);
        console.log(user.username);
        console.log(user.email);
        console.log(user.password);
        console.log(user._id);

        //return user;
        if(user.password === thePassword){
            req.session.userId = user._id;
            console.log(req.session.userId);
          //  res.redirect('/Upload')
            res.render('upload.hbs',{
                user:user.username  })

        }else{
            res.send('Incorrect Username and/or Password!');
        }

    });



 })






app.get('/upload', redirectLogin, (req, res, next) => {

    res.render('upload.hbs');
})

    // if(req.session.loggedin){
    //     res.send(`<h1>Welcome back, ${req.session.username}</h1>`)
    //     res.end(`<a href=/upload> Upload your photo </a>`);
    // }else {
	// 	res.send(`Please <a href="/login">Log in</a> to view this page!`);
	// }


    // sess = req.session;
    // if(sess.email){
    //     res.write(`<h1>Hello ${sess.email}')</h1></br>`);
    //     res.end(`<a href=/logout>Logout </a>`);
    // }else{
    //     res.write(`<h1>Please login first <h1>`);
    //     res.end(`<a href="/login">Sign In</a> `);
    // }
    // res.render('upload.hbs')

// })

app.get('/signup', redirectUpload, (req, res) => {
    res.render('signup.hbs');
})

app.post('/signup', redirectUpload, (req, res) => {

    db.collection('user').insertOne(req.body, (err, result) => {
     if (err) return console.log(err)

     console.log('saved to database') //debug console message
     res.redirect('/login')
   })
  })


app.get('/logout', redirectLogin , (req,res) => {
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.redirect('/')
    })
} )
