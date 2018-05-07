var express = require("express");
var app = express();
var router = require("./router/router");
var session = require("express-session");

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
    // cookie: { secure: true }
}));


app.set("view engine", "ejs");

app.use(express.static("./public"));
app.use("/avatar", express.static("./avatar"));

app.get("/", router.showIndex);
app.get("/regist", router.showRegist);
app.post("/doregist", router.doRegist);
app.get("/login", router.showLogin);
app.post("/dologin", router.doLogin);
app.get("/setavatar", router.showSetavatar);
app.post("/dosetavatar", router.dosetavatar);
app.get("/cut", router.showCut);
app.get("/docut", router.docut);
app.post("/post", router.dopost);
app.get("/getallshuoshuo", router.getAllShuoshuo);
app.get("/getuserinfo", router.getuserinfo);
app.get("/getshuoshuoamount", router.getshuoshuoamount);
app.get("/user/:user", router.showUser);
app.get("/userlist", router.showalluserlist);


app.listen(3000);