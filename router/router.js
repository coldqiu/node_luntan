var formidable = require("formidable");
var db = require("../modles/db.js");
var md5 = require("../modles/md5.js");
var path = require("path");
var fs = require("fs");
var gm = require("gm");


exports.showIndex = function(req, res, next) {
    if(req.session.login == "1") {
        //登录了，从数据库找 头像（不用session)
        db.find("user", {username: req.session.username}, function(err, result ) {
            var avatar = result[0].avatar || "default.jpg";
            db.find("posts",{}, {"sort": {"datetime": -1}}, function(err, result2) {
                res.render("index", {
                    "login": true,
                    "username": req.session.username || "",
                    "avatar": avatar, //登陆人的头像
                    "shuoshuo": result2,
                    "active": "index"
                });
            });

        });

    }else {
        res.render("index", {
            "login": req.session.login == "1" ? true : false,
            "username": req.session.username || "",
            "avatar": "default.jpg",
            "active": "index"
        });
    }

};

exports.showRegist = function(req, res, next) {
    res.render("regist", {
        "login": false,
        "active": "regist",
        "username": ""
    });
};

exports.doRegist =  function(req, res, next) {
    //获取用户输入的内容
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
        //处理 内容
        var username = fields.username;
        var password = fields.password;
        console.log("username:", username);
        db.find("user", {"username": username}, function(err, result) {
            if(err) {
                res.send("-3");
                return;
            }
            console.log("result.length:", result.length);
            if(result.length != 0) {
                res.send("-1"); // 用户名被占用
                return;
            }

            // 设置MD5加密
            password = md5(md5(password) + "110");

            db.insertOne("user", {
                "username": username,
                "password": password,
                "avatar": "default.jpg"
            }, function(err, result) {
                if(err) {
                    res.send("-3");
                    return;
                }
                req.session.login = "1";
                req.session.username = username;
                res.send("1");
                return;
            })
        });
    });
};

exports.showLogin = function (req, res, next) {
  res.render("login",{
      "login": false,
      "active": "login",
      "username": ""
  });
};

exports.doLogin = function(req, res, next) {
    var form = formidable.IncomingForm();

    form.parse(req, function(err, fields, file) {
       var username =  fields.username;
       var password = fields.password;
       console.log("username:", username);

       var jiami = md5(md5(password) + "110");

       db.find("user", {"username": username}, function(err, result) {
           if(err) {
               res.send("-5");
               return;
           }
           if(result.length == 0) {
               res.send("-1");
               return;
           }
           if(result[0].password !== jiami) {
               res.send("-2");
               return;
           }else {
               req.session.login = "1";
               req.session.username = username;
               res.send("1");
               return;
           }
       });
    });
};

// 设置头像 必须是登录状态
exports.showSetavatar = function(req, res, next) {
    if(req.session.login != "1") {
        res.send("这个页面需要登录才能访问");
        return;
    }
    res.render("setavatar", {
        "login": true,
        "username": req.session.username,
        "active": "setavatar",
    });
};

exports.dosetavatar = function(req, res, next) {
    if(req.session.login != "1") {
        res.send("这个页面需要登录才能访问");
        return;
    }else {
        var form = new formidable.IncomingForm();
        form.uploadDir = path.normalize(__dirname + "/../" + "avatar");
        form.parse(req, function(err, fields, files) {
            //console.log("files:", files);
            var oldpath = files.touxiang.path;
            var newpath = path.normalize(__dirname + "/../avatar") + "/" + req.session.username + ".jpg";
            req.session.avatar = req.session.username + ".jpg";
            fs.rename(oldpath, newpath, function(err) {
                if(err) {
                    res.send("失败！");
                    return;
                }

                res.redirect("/cut");
            });
        });

    }
};

exports.showCut = function(req, res, next) {

    var avatar = req.session.avatar;
    res.render("cut", {
        "login": req.session.login == "1" ? true : false,
        "username": req.session.username,
        "avatar": avatar,
        "active": "cut"
    });
};

exports.docut = function(req, res, next) {
      var filename = req.session.avatar;
      var w = req.query.w;
      var h = req.query.w;
      var x = req.query.x;
      var y = req.query.y;

      gm("./avatar/" + filename)
          .crop(w,h,x,y)
          .resize(100, 100, "!")
          .write("./avatar/" + filename, function(err) {
             if(err) {
                 res.send("-1");
                 return;
             }
             //更改数据库中的头像
             db.updateMany("user", {"username": req.session.username},{
                 $set: {"avatar": req.session.avatar}}, function(err, result){
                 if(err) {
                    res.send("churuo");
                 }
                 res.send("1");
             });

          });

};

//发表说说
exports.dopost = function(req, res, next) {
    //必须登录
    if(req.session.login != "1") {
        res.send("这个页面需要登录");
        return;
    }
    var username = req.session.username;
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var content = fields.content;
        console.log("content:", content);
        db.insertOne("posts", {
            "username": username,
            "datetime": new Date(),
            "content": content
        }, function(err, result) {
            if(err) {
                res.send("-3");
                return;
            }
            res.send("1");
        });
    });


};

exports.getAllShuoshuo = function(req, res, next) {
    var page = req.query.page;
    console.log("page:", page);
    db.find("posts", {}, {"pageamount": 6, "pages": page,"sort":{"datetime":-1}},function(err, result) {
        // res.json("result", result);
        //console.log("length:", result.length);
        //console.log("result:", result);
        var result = {"result": result};
        res.send(result);
    });
};

exports.getuserinfo = function(req, res, next) {
    var username = req.query.username;
    db.find("user", {"username": username}, function(err, result) {
        var obj = {
            "login": req.session.login == "1" ? true : false,
            "username": result[0].username,
            "avatar": result[0].avatar,
            "_id": result[0]._id
        };
        res.json(obj);

    });

};

exports.getshuoshuoamount = function(req, res, next) {
    db.getAmount("posts", function(count) {
        var obj = {
            "count": count
        };
        res.send(obj);
        return;

    });
};

exports.showUser = function(req, res, next) {
    if(req.session.login != "1") {
        res.redirect("/login");
        return;
    }
    var user = req.params["user"];
    var username = req.session.username;
    db.find("posts", {"username": user}, function(err, result) {
            db.find("user", {"username": user}, function(err, result2) {
                console.log("result2:", result);
                res.render("user", {
                    "login": req.session.login == "1" ? true : false,
                    "username": username,
                    "user": user,
                    "result": result,
                    "avatar": result2[0].avatar,
                    "active": "allshuoshuo"
                });
            });

        });
};

exports.showalluserlist = function(req, res, next) {
    db.find("user",{}, function(err, result) {
        res.render("alluser", {
            "login": req.session.login == "1" ? true : false,
            "username": req.session.login == "1" ? req.session.username : "",
            "active": "alluser",
            "result": result
        });
    })
}