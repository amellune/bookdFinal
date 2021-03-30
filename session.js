// set up express & dependencies

const express = require('express');
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var morgan = require("morgan");
const User = require('./models/User');


// // for image uploading
// const multer = require('multer');
// const path = require('path');


// // for image validation
// const helpers = require('./models/helpers');

// const hbs = require('hbs'); //templating engine
// var MongoClient = require('mongodb').MongoClient;
// var url = "mongodb+srv://Jessie:Mongodb@bookd.hy23l.mongodb.net/test";


const app = express();


////define teh storage location for images and add file extensions back

// app.use(express.static(__dirname + '/public'));

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       //  cb(null, 'uploads/');

//         cb(null, 'public/uploads');
//     },

//     filename: (req,file,cb) => {
//        // cb(null, Date.now() + "-" + file.originalname)
//       cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));

//     // const ext = file.mimetype.split('/')[1];
//     // cb(null, `${Date.now()}.${ext}`);

//     }
// })



// var db;
// MongoClient.connect(url, function(err, client) {
//     if (err) throw err;
//     db = client.db('bookd');
//     console.log("Database connected!");
//    });

// app.use(bodyParser.urlencoded({extended: true}))
// app.set('view engine', 'hbs');


app.set("port", 3000)


// set morgan to log info about our requests for development use.
app.use(morgan("dev"));

// initialize body-parser to parse incoming parameters requests to req.body
app.use(bodyParser.urlencoded({ extended: true }));

// initialize cookie-parser to allow us access the cookies stored in the browser.
app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(
  session({
    key: "user_sid",
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
    expires: 600000,  //cookies on the browser for 6 days
    },
  })
);

// if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
    res.clearCookie("user_sid");
  }
  next();
});

// function to check for logged-in users
var sessionChecker = (req, res, next) => {
  if (req.session.user && req.cookies.user_sid) {
    res.redirect("/dashboard");
  } else {
    next();
  }
};



// route for Home-Page
app.get("/", sessionChecker, (req, res) => {
    res.redirect("/login");
  });

  //write login

  app
  .route("/login")
  .get(sessionChecker, (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
  })
  .post(async (req, res) => {
    var username = req.body.username,
      password = req.body.password;

      try {
        var user = await User.findOne({ username: username }).exec();
        if(!user) {
            res.redirect("/login");
        }
        user.comparePassword(password, (error, match) => {
            if(!match) {
              res.redirect("/login");
            }
        });
        req.session.user = user;
        res.redirect("/dashboard");

    } catch (error) {
      console.log(error)
    }
  });


  //write signup

  app
  .route("/signup")
  .get(sessionChecker, (req, res) => {
    res.sendFile(__dirname + "/public/signup.html");
  })
  .post((req, res) => {

    var user = new User({
      username: req.body.username,
      email: req.body.email,
      password:req.body.password,
    });
    user.save((err, docs) => {
      if (err) {
        res.redirect("/signup");
      } else {
        console.log(docs)
        req.session.user = docs;
        res.redirect("/dashboard");
      }
    });
  });


// route for user's dashboard
app.get("/dashboard", (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
      res.sendFile(__dirname + "/public/dashboard.html", (err,data)=>{
          res.send(req.session)
      });
    } else {
      res.redirect("/login");
    }
  });

  // route for user logout
app.get("/logout", (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
      res.clearCookie("user_sid");
      res.redirect("/");
    } else {
      res.redirect("/login");
    }
  });

// // // upload page

// const upload = multer({storage:storage})

// app
// .route("/upload")
// .get(sessionChecker, (req,res)=>{
//     res.sendFile(__dirname + "/public/upload.html");
// })
// .post((req, res) => {

//     // 'book_cover' is the name of our file input field in the HTML form
//     let upload = multer({ storage: storage,fileFilter: helpers.imageFilter }).single('book_cover');

//     upload(req, res, function(err) {
//         // req.file contains information of uploaded file
//         // req.body contains information of text fields, if there were any

//         if (req.fileValidationError) {
//             return res.send(req.fileValidationError);
//         }
//         else if (!req.file) {
//             return res.send('Please select an image to upload. <a href="./upload"> Upload image</a>');
//         }
//         else if (err instanceof multer.MulterError) {
//             return res.send(err);
//         }
//         else if (err) {
//             return res.send(err);
//         }

//         // Display uploaded image for user validation


//         return res.send(`You have uploaded this image: <hr/><img src="uploads/${req.file.filename}" width="500"><hr /><a href="./upload-cover-image">Upload another image</a>`);


//         })

// });





//set application port

app.listen(app.get("port"),()=>{
    console.log("App is listening on Port 3000")
})
