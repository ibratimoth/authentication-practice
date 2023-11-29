const express=require('express');
const mongodb=require('mongodb');
const bcrypt=require('bcryptjs');

const router=express.Router(); 
const db=require('../data/database');

router.get('/',function(req,res){
    res.render('welcome');
});
router.get('/login',function(req,res){
    let sessionInputData=req.session.inputData;

    if(!sessionInputData){
        sessionInputData={
            hasError:false,
            email:'',
            password:'',
        };
    }

    req.session.inputData=null;
    res.render('login',{inputData:sessionInputData});
});
router.get('/signupform',function(req,res){
    let sessionInputData=req.session.inputData;

    if(!sessionInputData){
        sessionInputData={
            hasError:false,
            email:'',
            confirmEmail:'',
            password:'',
        };
    }

    req.session.inputData=null;
    res.render('signup',{inputData:sessionInputData});
}); 
router.post('/signupform',async function(req,res){
    const userData=req.body;
    const enteredEmail=userData.email;
    const enteredConfirmEmail=userData ['confirm-email'];
    const enteredPassword=userData.password;
    const hashedPassword= await bcrypt.hash(enteredPassword,12);

    if(
        !enteredEmail||
        !enteredConfirmEmail||
        !enteredPassword||
        enteredPassword.trim()< 6||
        enteredEmail !==enteredConfirmEmail||
        !enteredEmail.includes('@')
    ){
        req.session.inputData={
            hasError:true,
            message:'Invalid input - please check your data',
            email: enteredEmail,
            confirmEnail:enteredConfirmEmail,
            password:enteredPassword,
        };
        req.session.save(function(){
            res.redirect('/signupform')
        });
        return;
    }

    const existingUser= await db.getDb().collection('users').findOne({email:enteredEmail});

    if(existingUser){
        req.session.inputData={
            hasError:true,
            message:'user exists already!!',
            email: enteredEmail,
            confirmEnail:enteredConfirmEmail,
            password:enteredPassword,
        };
        req.session.save(function(){
            res.redirect('/signupform')
        });
        return;
    }

    const user={
        email:enteredEmail,
        password:hashedPassword
    };

    await db.getDb().collection('users').insertOne(user);

    res.redirect('/login')
});

router.post('/login',async function(req,res){
    const userData=req.body;
    const enteredEmail=userData.email;
    const enteredPassword=userData.password;

    const existingUser= await db.getDb().collection('users').findOne({email:enteredEmail});

    if(!existingUser){
        req.session.inputData={
            hasError:true,
            message:'could not log you in - check your credentials',
            email: enteredEmail,
            password:enteredPassword,
        };
        req.session.save(function(){
            res.redirect('/login')
        });
        return;
    }

    const passwordAreEqual=await bcrypt.compare(enteredPassword,existingUser.password);

    if(!passwordAreEqual){
        req.session.inputData={
            hasError:true,
            message:'could not log you in - check your credentials.',
            email: enteredEmail,
            password:enteredPassword,
        };
        req.session.save(function(){
            res.redirect('/login')
        });
        return;
    }

    req.session.user={id:existingUser._id,email:existingUser.email};
    req.session.isAuthenticated=true;
    req.session.save(function(){
        res.redirect('/admin');
    });
});
router.get('/admin',async function(req,res){
    const isAuth=req.session.isAuthenticated;
    res.locals.isAuth=isAuth;
    if(!res.locals.isAuth){
        return res.status(401).render('401');
    }

    const user=await db.getDb().collection('users').findOne({email:req.session.user.email});

     if(!user||!user.isAdmin){
        return res.status(403).render('403');
    }
    res.render('admin');
});
router.get('/profile',function(req,res){
    if(!req.session.isAuthenticated){
        return res.status(401).render('401');
    }
    res.render('profile');
});
router.post('/logout',function(req,res){
    req.session.user=null;
    req.session.isAuthenticated=false;
    res.redirect('/');
});
module.exports= router;