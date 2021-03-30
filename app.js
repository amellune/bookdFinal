
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

var url = "mongodb+srv://Jessie:Mongodb@bookd.hy23l.mongodb.net/test";

var db;


//connect to the MongoDB
MongoClient.connect(url, (err, client) => { //this is localhost connection string, for cloud drop the connection string, the localhost address: mongodb+srv://corawan:admin@cluster0.palg8.mongodb.net/test?authSource=admin&replicaSet=atlas-l4f3ow-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true
  if (err) return console.log(err);

  db = client.db('bookd'); //Sets the database to work with


//starts a server
app.listen(3000, () => {
    console.log('listening on port 3000')
  })
})

// session-based authentication

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

const redirectDash = (req, res, next)=>{
    if(req.session.userId){
        res.redirect('/dashboard')
    }else{
        next()
    }
}

// for image upload

app.use(express.static(path.join(__dirname, 'public')))  //making this public folder accessable

//app.use(express.static('./public/uploads'));

app.use(fileUpload(
//     {
//     useTempFiles: true,
//     tempFileDir: path.join(__dirname, 'tmp'),
//     createParentPath:true,
//     limit:{fileSize:1024}
// }
));


//routing the "landing page/sign in" form
app.get('/', (req, res) => {
    res.render('index.hbs'); //by default, hbs views are placed in a "views" folder
})

app.get('/signup', redirectDash, (req, res) => {
    res.render('signup.hbs');
})

app.post('/signup', redirectDash, (req, res) => {

    db.collection('user').insertOne(req.body, (err, result) => {
     if (err) return console.log(err)

     console.log('saved to database') //debug console message
     res.redirect('/login')
   })
  })

var sess; var thePassword; var theEmail; var user; var password; var thisKeyword;
var fileName;

app.get('/login', redirectDash, (req, res) => {
  res.render('login.hbs'); //by default, hbs views are placed in a "views" folder
})

app.post('/login', redirectDash, (req, res, next) => {

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
          req.session.userName = user.username;
          req.session.userId = user._id;
          console.log(req.session.userId);
          res.redirect("/dashboard");

          // res.render('dashboard.hbs',{
          //     user:user.username})

      }else{
          res.send('Incorrect Username and/or Password!');
      }

  });


})



app.get('/logout', redirectLogin , (req,res) => {
    req.session.destroy((err) => {
        if(err) {
            return console.log(err);
        }
        res.redirect('/')
    })
} )

//display the "Add book" form
app.get('/add-book', redirectLogin, (req, res) => {
    res.render('add-book.hbs'); //by default, hbs views are placed in a "views" folder
 })

let uploadImage, uploadPath, data;
 //routing a /book to a functionality
 app.post('/add-book', async(req, res, next) => {

     // try{
        console.log(req.files.cover);
         uploadImage = req.files.cover;
         fileName = new Date().getTime().toString() + path.extname(uploadImage.name);
         uploadPath = path.join(__dirname ,'public', '/uploads', fileName);
         uploadImage.mv(uploadPath);

         //mongdb data creation
         data = {
            cover: fileName,
            // cover: uploadPath,
             // cover:uploadImage,
             details: req.body,
         }

         db.collection('book').insertOne(data, (err, result) => {
          if (err) return console.log(err)
          console.log(data)
          console.log('saved to database') //debug console message
          res.redirect('/dashboard')
             })

 })


  app.get('/book', (req, res) => {
      db.collection('book').findOne({}, (err, result) => {
        if (err) throw err;
        //To pass variables to a view, include an object as a second parameter. Here we pass "result" data.
        //The view will reference it as "notes"
        res.render('book.hbs', {book: result}) //by default, hbs views are placed in a "views" folder.
    })
    })

 app.get('/add-keyword', redirectLogin, (req, res) => {
    res.render('add-keyword.hbs'); //by default, hbs views are placed in a "views" folder
 })


 app.post('/add-keyword', (req, res) => {


     //mongdb data creation
     data = {
        email: theEmail,
        // cover: uploadPath,
         // cover:uploadImage,
        keywords: req.body,
     }


     db.collection('keywords').insertOne(data, (err, result) => {
      if (err) return console.log(err)
      console.log(data)
      console.log('saved to KEYWORDS') //debug console message
      res.redirect('/profile')
    })



    // db.collection('user').update(
    //     {_id:req.session.userId},
    //     {keyword:req.body},
    //     (err, result) => {
    //  if (err) return console.log(err)
    //
    //  console.log(req.body)
    //
    //  console.log('saved to USER') //debug console message
    // res.redirect('/profile')
   //})
 })





//display the dashboard/main page


app.get('/dashboard', redirectLogin, (req, res) => {

    db.collection('keywords').find({email: theEmail})
    .next()
    .then(keyword=> {

        console.log(keyword.keywords.keywords);
        const keyword1 = keyword.keywords.keywords[0];
        const keyword2 = keyword.keywords.keywords[1];
        const keyword3 = keyword.keywords.keywords[2];
        console.log(keyword1);
        console.log(keyword2);
        console.log(keyword3);

        // console.log(keyword.keywords);
        // thisKeyword = keyword.keywords.keywords;
        // console.log(thisKeyword);

        db.collection('book').find({"details.keywords":{$in: [keyword1,keyword2,keyword3]}}).toArray((err, result) => {
            if (err) return console.log(err)
            //To pass variables to a view, include an object as a second parameter. Here we pass "result" data.
        //The view will reference it as "notes"
        res.render('dashboard.hbs', {book: result}) //by default, hbs views are placed in a "views" folder.

        })

    })
})



// app.get('/dashboard',redirectLogin, (req, res) => {
//  // res.render('/dashboard'); //by default, hbs views are placed in a "views" folder
//   db.collection('book').findOne({}, (err, result) => {
//     if (err) throw err;
//     //To pass variables to a view, include an object as a second parameter. Here we pass "result" data.
//     //The view will reference it as "notes"
//     res.render('dashboard.hbs', {book: result}) //by default, hbs views are placed in a "views" folder.
//   })
//   })


app.post('/dashboard', (req, res) => {
  res.redirect('/dashboard'); //by default, hbs views are placed in a "views" folder
});

//display the profile page
app.get('/profile', redirectLogin, (req, res) => {
    db.collection('keywords').find(({email: theEmail})).toArray((err, result) => {
        if (err) return console.log(err)
        //To pass variables to a view, include an object as a second parameter. Here we pass "result" data.
    //The view will reference it as "notes"
    res.render('profile.hbs', {keywords: result}) //by default, hbs views are placed in a "views" folder.

  })
})

//view all books

app.get('/seeBook',(req, res) => {

    db.collection('book').find().toArray((err, result) => {
           if (err) return console.log(err)
    //To pass variables to a view, include an object as a second parameter. Here we pass "result" data.
    //The view will reference it as "notes"
    res.render('seeBook.hbs', {book: result}) //by default, hbs views are placed in a "views" folder.
})
})

app.post('/delete-keyword1', (req, res)=>{
    db.collection("keywords").update(  //remove a field from a collection
        {email: theEmail},
        {$pop: {keywords:-1}}
    )
    res.redirect('/profile')

})

// routing a specific book when click "view"
app.get('/view/', (req,res)=>{

    console.log(req.body.id);
    console.log(req.body.title);
    var id = req.params.id;

    db.collection('book').find({_id: id}).toArray((err, result) => {
           if (err) return console.log(err)
    //To pass variables to a view, include an object as a second parameter. Here we pass "result" data.
    //The view will reference it as "notes"
    res.render('view.hbs', {book: result}) //by default, hbs views are placed in a "views" folder.
})
})






app.post('/delete-confirm', (req, res) => {
  var myquery = { 'email-address': 'emailaddress@email.com'};
  db.collection('user').deleteOne(myquery, (err, obj) => {
    if (err) return console.log(err);

    console.log("1 document deleted");
    res.redirect('/index')
  });
})
