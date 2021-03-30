
/// set up express & dependencies 

const express = require('express');
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var morgan = require("morgan");



// for image uploading
const multer = require('multer');
const path = require('path');
const ejs = require ('ejs');

// init app
const app = express();

//EJS

app.set('view engine', 'ejs');

// //Public Folder
app.use(express.static('./public'));
// const User = require('./models/User');

// // for image validation
// const helpers = require('./models/helpers');



//set storage Engline 


const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: function (req, file, cb){
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });

//Init Upload

const upload = multer({
  storage: storage,
  limits:{filesize:1000000},
  fileFilter: function(req, file, cb){
    checkFileType(file,cb);
  }
}).single('myImage');

//check File Type
function checkFileType (file, cb){
  //Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  //check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  //check mimetype 
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null, true);
  }else{
    cb('Error: Images Only');
  }
}



app.get('/upload' ,(req, res) => res.render('upload'));

app.post('/upload', (req, res) =>{
  upload( req, res, (err) =>{
    if(err){
      res.render('upload', {
        msg: err
      });
    }else{
      console.log(req.file);
      if(req.file == undefined){
        res.render('upload',{
          msg: 'Error: No File Selected!'
        });
      }else{
        res.render('upload', {
          msg: 'File Uploaded!',
          file: `uploads/${req.file.filename}`
        })
      }


    }

  });
});



const port = 3000;
app.listen(port, () => console.log(`server started on port ${port}`))