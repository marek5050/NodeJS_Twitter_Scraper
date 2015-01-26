var http = require('http');
var jsdom = require('jsdom');
var _ = require('lodash');
var winston = require('winston');
var util = require('util');
var Crawler = require("crawler");
var url = require('url');

var id = null;

function p(data){
    console.log(util.inspect(data,{depth:5}));
}

var c = new Crawler({
    maxConnections : 10,
    rateLimits: 800,
    jQuery: {
        name: 'cheerio',
        options: {
            normalizeWhitespace: false,
            xmlMode: false,
            decodeEntities: true
        }
    },
    // This will be called for each crawled page
    callback : function (error, result, $) {
        if($ == null) {
            console.log("EMPTYYYYY");
            console.log("ERROR:  " + error);
            console.log("RESULT: " ,result);



            return;
        }

        // $ is Cheerio by default
        // a lean implementation of core jQuery designed specifically for the server
        $(".tweet").each(function(index, div){
            var user = $(div).find(".username").text();
            user = user.replace("@","").replace(" ", "").trim();
            var text = $(div).find(".tweet-text").text();
        //    console.log("USER:" , user , " text: ", text );
            processTweet(user, text);
        });

        var path;

        $(".w-button-more a").each(function(index,a){
            path = a.href;
            c.queue(path);
        });
    },
    onDrain: function(){
        p("No More URLS.... FINISHED");
        process.send({status:"COMPLETE"});
    }
});

process.on('message', function(m) {
//    console.log(m);

     if(id == null && m.config != "undefined"){
         id = m.config.id;
         return;
     }

//    console.log("CHILD: " + id + " got user: " +  m.handle);
    try {

       var link  = "https://mobile.twitter.com/search?q=from%3A"+ m.handle+" %28%22send%22+AND+%22to%22%29+OR++%22twitterhandle%22+OR+%22email+at%22+OR+%22email+me%22+OR+%22gmail%22+OR+%22at+yahoo%22+OR+%22%40yahoo%22+OR+%22aol%22+OR+%22contact%22+OR+%22Email+your%22&s=typd&x=0&y=0";
       // p(link);
       c.queue(link);

    }catch(err){

        process.send({status:"FAILED", handle: m.handle, att: m.att+1});

    }
});


function finishUser(account){

    process.send({status:"SUCCESS", handle: account,email:"stop@gmail.com", msg: "The world and its sons", att: 0});

}


function processUserLink(account,link){
    var tweets = [] ;
    jsdom.env(link,
        ["http://code.jquery.com/jquery.js"],
        function(errors,window)
        {
            try {
                tweets = window.$(".tweet-text div");
                console.log("Found ",tweets.length, "  at " + account + " at " + link);

                if(tweets.length != "undefined" && tweets.length > 0) {
                    _(tweets).each(function (item) {
                        processTweet(account, item);
                    });
                }
                npath = window.$(".w-button-more a");
                if(npath.length != "undefined" && npath.length > 0){
                    path = npath[0].href;
                    processUserLink(account, path);
                }else{
                    new Error("Finished");
                }
            }catch(err){
                finishUser(account);
                console.error(err);
                console.error(link);
            }
        });
}





function replaceAll(find, replace, str) {
    return str.replace(new RegExp(find, 'g'), replace);
}






function validateEmail(email) {
    var re = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    return email.match(re);
}








function processUser(_user){
    var account = _user;
    var link="";
    console.log("processUser: " + account);


//
////https://mobile.twitter.com/search?q=%40England_Netball+email+me&s=typd&x=0&y=0
//
//    if("" != account) {
//
//        started.push(account);
//
//        log_verified.log("info", account);
//
//        link = "https://mobile.twitter.com/search?q=from%3A"+account+" %28%22send%22+AND+%22to%22%29+OR++%22twitterhandle%22+OR+%22email+at%22+OR+%22email+me%22+OR+%22gmail%22+OR+%22at+yahoo%22+OR+%22%40yahoo%22+OR+%22aol%22+OR+%22contact%22+OR+%22Email+your%22&s=typd&x=0&y=0";
//        processUserLink(account, link);
//    }
}



function processTweet(account,_tweet){
//    console.log("ProcessTweet ", account, _tweet);
    var text = _tweet;
    text = replaceAll("twittername", account, text);
    text = replaceAll("[\\[\\]\\{\\}]", " ", text);

    var alpha = validateEmail(text);

    if(alpha==null || alpha.length < 1){
        text = replaceAll(" at ", "@", text);
        text = replaceAll(" dot ", ".", text);

        alpha = validateEmail(text);
    }


    if(alpha!= null && alpha.length > 0 )
    {
      p({status: "SUCCESS" ,handle:account,  email: alpha,msg: text});
      process.send({status:"SUCCESS", handle: account, email:alpha, msg: _tweet });
    }
}
