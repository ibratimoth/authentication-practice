const express=require('express');
const path=require('path');
const demoRoutes=require('./routes/demo')
const db=require('./data/database')
const session=require('express-session');
const mongodbStore=require('connect-mongodb-session');
const mongodb=require('mongodb');

const MongodbStore=mongodbStore(session);
const app=express();

const sessionStore=new MongodbStore({
    uri:'mongodb://127.0.0.1:27017',
    databaseName:'auth-demo',
     collection: 'sessions'
});

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

app.use(session({
    secret: 'super-secret',
    resave:false,
    saveUninitialized: false,
    store: sessionStore 
}));
app.use('/',demoRoutes);

app.use(async function(req,res,next){
    const user=req.session.user;
    const isAuth=req.session.isAuthenticated;

    if(!user||!isAuth){
        return next();
    }

    res.locals.isAuth=isAuth;
    
     next();
});

app.use(function(req,res){
    res.status(404).render('404');
});
app.use(function(error,req,res,next){
    console.log(error);
    res.status(500).render('500');
});
let port=3600;

db.connectToDatabase().then(function(){
    app.listen(port,function(){
        console.log('sever has started')
        console.log('connected succesfull');
    });
}).catch(function(error){
    console.log('Failed to connect to the database');
    console.log(error);
});
