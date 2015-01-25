var http = require('http');
var jsdom = require('jsdom');
var _ = require('lodash');
var winston = require('winston');
var util = require('util');
var Crawler = require("crawler");
var url = require('url');
var spawn_child = require('child_process');


var MAX = 5;
var children = [];
var pagecount = 0;
var emails = [];
var finished = [];
var started = [];


function c(data){

    console.log(util.inspect(data,{depth:4}));

}


function EventedArray(handler) {
    this.stack = [];
    this.idx = 0;

    this.push = function(obj) {

        this.stack[obj.handle] = false;
        this.idx++;

        if(this.idx >= MAX){
            this.idx = 0;
        }

        children[this.idx].send(obj);

    };

    this.pop = function(obj) {
      //  this.callHandler();
        this.stack[obj.handle] = true;
    };


    this.getArray = function() {
        return this.stack;
    };
}




var handler = function() {

    console.log('something changed');

};


var queue = new EventedArray();


var log_emails = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({ filename: './emails.log', level:'info',timestamp:false,    json:false   }),
    ]
});

var log_verified = new (winston.Logger)({
    json:false,
    transports: [
        new (winston.transports.File)({ filename: './verifiedUsers.log', level:'info', timestamp:false,    json:false })
    ]
});



function childResponse(result){

    if(result.status == "FAILED" ) {

            console.log("User Failed: ", result);
            queue.push({handle: result.handle, att: result.att});

    }else if(result.status == "SUCCESS") {
            delete result.status;
//            console.log('PARENT got message:', result);
            log_emails.log("info", result);

    }else if(result.status == "COMPLETE"){

            this.kill('SIGHUP');

    }
}



function spawnChildren( num ){
    console.log("spawnChildren "+ num);

    var child;

    for(var  i = 0 ; i < num ; i++){

        child = spawn_child.fork("processUser.js");
        child.send({config: {id: i } });
        child.on('message', childResponse);
        children.push(child);

    }
}



function processVerifiedList(path){
    return;
    if(pagecount++ > 1){return; }
    pagecount++;

    console.log("<<---------------------PageCount:  ----------------------"+ pagecount);

    jsdom.env(path,
        ["http://code.jquery.com/jquery.js"],
        function(errors,window)
        {
            try{

                items = window.$(".screenname a");

                console.log("Found", items.length /2 , " verified users!");

                _(items).each(        queue.push({handle: processUser,att:0 })     );

                queue.process();

                npath = window.$(".w-button-more a");
                if(npath.length != "undefined" && npath.length > 0){
                    path = npath[0].href;
                    processVerifiedList(path);
                }

            }catch(err){
                console.log(err);
                console.log(path);
            }
        }
    );
}




var crawl = new Crawler({
    maxConnections : 10,
    rateLimit:500,
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


        // c("   crawler callback ");
        // c(result);
        //  console.log("callback: ", result,  error);
        //  $ is Cheerio by default
        //  a lean implementation of core jQuery designed specifically for the server
//        console.log($(".screenname a"));

     $(".screenname a").each(function(index, alink){

        try{
            var user = alink.attribs.name;
             if(typeof user != "undefined"){
                log_verified.log("info", ""+user);
                 queue.push({handle: user, att:0});
             }

        }catch(err){

        }
       });

       var path;

     $(".w-button-more a").each(function(index,a){
        //         c(a.attribs.href);
         path = "http://mobile.twitter.com" + a.attribs.href;
        //          c("ADDING MORE: " + path);
         if(path!=null && path!="")
                crawl.queue(path);
     });
    },
    onDrain: function(){
        c("No More URLS.... FINISHED");
    }
});





function finishedVerifiedList(){
//    c("finishedVerifiedList " + _.keys(emails).length);
//    var p = _.pairs(emails);
//    _.each(p,function(pair){
//        console.log("logging....",  pair);
//        log_emails.log("info", pair);
//    });
}



function start(){
    console.log("start");


    var url = "http://mobile.twitter.com/verified/following";

    spawnChildren(MAX);

    crawl.queue(url);


    return;
}


start();