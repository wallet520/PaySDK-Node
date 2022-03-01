var port = 8888;

function sysError(response,err) {
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write(err.toString());
    response.end();
}

function getSign(query, response) {
    var temp = decodeURI(query).split("&");
    var obj = {};
    var secretKey;
    for(var i=0;i<temp.length;i++){
        var t = temp[i].split("=");
        if(t[0]=="secretKey"){
            secretKey = t[1];
        }else{
            obj[t[0]] = t[1];
        }
    }
    var sign = generateHeaders(obj.access_key,secretKey,obj);
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write(sign);
    response.end();
}

function defaults(query, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write("");
    response.end();
}

var http = require("http");
var url = require("url");

function start(route, handle) {
    function onRequest(request, response) {
        var urlObj = url.parse(request.url);
        var pathname = urlObj.pathname;
        var query = urlObj.query;
        route(pathname, query, handle, response);
    }

    http.createServer(onRequest).listen(port);
    console.log("Server has started.");
}

var handle = {}
handle["/"] = defaults;
handle["/getSign"] = getSign;

function route(pathname, query, handle, response) {
    if (typeof handle[pathname] === 'function') {
        handle[pathname](query, response);
    } else {
        sysError(response,"404 not found");
    }
}

start(route, handle);

// var CryptoJS = require("crypto-js");
// var Base64 = require('crypto-js/enc-base64');
// const crypto = require('crypto');
var hmacsha1 = require('hmacsha1');
const { concatSeries } = require("async");

function getUuid() {
    let chars =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
    let uuid = new Array(32);
    let rnd = 0;
    for (let i = 0; i < 32; i++) {
        if (i === 12) {
            uuid[i] = "4";
        } else {
            if (rnd <= 0x02) rnd = (0x2000000 + Math.random() * 0x1000000) | 0;
            let r = rnd & 0xf;
            rnd = rnd >> 4;
            uuid[i] = chars[i === 19 ? (r & 0x3) | 0x8 : r];
        }
    }
    return uuid.join("");
}

function generateHeaders(accessKey,secretKey,params) {
    const timestamp = "1646043051018";
    const nonce = "329F2C130C294C52736A5EC8B8014FB0";
    let map = {
        access_key: accessKey,
        timestamp,
        nonce,
    };
    map = {
        ...map,
        ...params
    }
    let mapString = "";
    Object.keys(map)
        .sort()
        .forEach(function (key) {
            mapString += key + "=" + map[key] + "&";
        });
    mapString = mapString.substring(0,mapString.length - 1);
    var sign = hmacsha1(secretKey, mapString);
    // var sign1 = crypto.createHmac('sha1', secretKey).update(mapString).digest('base64');
    // console.log(sign1);
    // var sign2 = Base64.stringify(CryptoJS.HmacSHA1(mapString, secretKey));
    // console.log(sign2);
    return sign;
}

