const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
    session({
      secret: "Mysecret",
      resave: false,
      saveUninitialized: false,
    })
  );
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  mongoose.connect("mongodb://localhost:27017/lmsDB", {
    useNewUrlParser: true,
  });

  const courseSchema = new mongoose.Schema({
    name:String,
    about: String,
    difficultylevel: String,
    videos: [String],
    teacher : String
  });

  const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    image: String,
    name: String,
    bio: String,
    role: String,
    course: [courseSchema]
  });

  
  
  userSchema.plugin(passportLocalMongoose);
  
  const User = new mongoose.model("User", userSchema);
  const Course = new mongoose.model("Course", courseSchema);

  
  passport.use(User.createStrategy());
  
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user){
      done(err, user);
    });
  });

  app.get("/", function (req, res) {
    res.render("indexPage");
  });

  app.get("/signup", function(req,res){
      res.render("singup");
  });

  app.get("/login", function(req,res){
    res.render("login");
});
 app.get("/addcourse",function(req,res){
    if(req.isAuthenticated()){
      res.render("addcourse", {user: req.user});
    }
    else{
      res.redirect("/login");
    }
    
 });

 app.get("/ishaan",function(req,res){
  Course.find({}, function(err, found){
    if(!err){
      console.log(found);
    }
  })
 });
app.get("/viewcourse",function(req,res){
  Course.find({}, function(err, foundItem){
    res.render("viewcourse", {course: foundItem});
  })
})
app.get("/dashboard",function(req,res){
  if (req.isAuthenticated()) {
    console.log(req.user);
    if(req.user.role==="teacher"){
      res.render("teacherhome", {user: req.user});
    }
    else{
      res.render("studenthome", {user: req.user});
    }
  } else {
    res.redirect("/login");
  }
});
app.post("/signup", function(req,res){
    res.redirect("signup");
})
app.post("/login", function(req,res){
    res.redirect("login");
})
app.post("/register", function (req, res) {
  console.log(req.body.username);

  User.register(
    {
      username: req.body.username,
      email: req.body.email,
      image: req.body.image,
      bio: req.body.bio,
      role: req.body.role,
      name: req.body.name
    },
    req.body.password,
    function (err, user){
      if (err) {
        console.log(err);
        res.redirect("/signup");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/dashboard");
        });
      }
    }
  );
});
app.post("/viewcourse",function(req,res){
  // const name1= req.body.name;
  // const about1= req.body.about;
  // const difficultylevel1 =  req.body.difficultylevel;
  // const teacher1 = req.body.teacher;
  // const course1 = new Course({
  //   name : name1,
  //   about: about1,
  //   difficultylevel: difficultylevel1,
  //   teacher: teacher1
  // })
  // course1.videos.push(req.body.video);
  const courseId = req.body.courseid;
  Course.findById(courseId,function(err,foundItem){
    if(!err){
      req.user.course.push(foundItem);
      req.user.save();
      res.redirect("/dashboard");
    }
  })
  
});
app.post("/addcourse",function(req,res){
  const name1= req.body.name;
  const about1= req.body.about;
  const difficultylevel1 =  req.body.difficultylevel;
  const teacher1 = req.body.teacher;
  const course1 = new Course({
    name : name1,
    about: about1,
    difficultylevel: difficultylevel1,
    teacher: teacher1
  })
  course1.videos.push(req.body.video);
  //console.log(req.user);
  req.user.course.push(course1);
  req.user.save();
  course1.save();
  res.redirect("/dashboard");
});
app.post("/log", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  //console.log("errors");
  req.login(user, function (err) {
    if (err) {
      //console.log("error");
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/dashboard");
      });
    }
  });
});
app.listen(3000,function(req,res){
  console.log("Server started on port 3000");
});