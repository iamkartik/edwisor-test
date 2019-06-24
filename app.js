const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/User');
const session  = require('express-session');
const mongoose = require('mongoose');
const path = require('path');

const app = express();


mongoose.connect('mongodb://localhost:27017/test');


passport.serializeUser((user,done)=>{
    done(null,user.id);
});

passport.deserializeUser((id,done)=>{
    User.findById(id,(err,user)=>{
        done(err,user);
    });
});

passport.use(new LocalStrategy({
    usernameField: 'email',   
    passwordField: 'password'},(email,password,done)=>{
    
    User.findOne({email:email.toLowerCase()},(err,user)=>{
        if(err){return done(err);}
        if(!user){
            return done(null,false,{msg:'Invalid Email'});
        }

        user.comparePassword(password,(err,match)=>{
            if(err){return done(err);}

            if(match){
                return done(null,user);
            }

            return done(null,false,{msg:'Invalid email or password'});
        });

    });
}));

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  };
  

app.set('views',path.join(__dirname,'views'));
app.set('view engine','pug');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret:'MYCATISRATISTRUE'
}))
app.use(passport.initialize());
app.use(passport.session());


app.get('/',isAuthenticated,(req,res)=>{
    res.render('home');
})

app.get('/login',(req,res)=>{
    res.render('login');
})


app.get('/home',isAuthenticated,(req,res)=>{
    res.render('home',{user:req.user.name});
})



app.get('/signup',(req,res)=>{
    res.render('signup');
})


app.get('/logout',(req,res,next)=>{
    req.logout();
    req.session.destroy((err) => {
    req.user = null;
    res.redirect('/login');
  });
});


app.post('/login',(req,res,next)=>{
    passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err); }
        if (!user) {

          return res.redirect('/login');
        }
        req.logIn(user, (err) => {
          if (err) { return next(err); }
          
          res.redirect('/home');
        });
      })(req, res, next);
    
});


app.post('/signup',(req,res,next)=>{

    const user = new User({
        email: req.body.email,
        password: req.body.password
      });

      user.save((err) => {
        if (err) { return next(err); }
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          res.redirect('/home');
        });
      });
})


app.listen('3000',(err)=>{
    console.log('server started at port 3000');
})