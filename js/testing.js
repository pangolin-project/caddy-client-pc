const urlParser = require('./url_parser.js');

//hs://base64(username:password)@lierccp.tk:443/?caddy=1
const testingLinkStr1 = "hs://dXNlcm5hbWU6cGFzc3dvcmQ=@lierccp.tk:443/?caddy=1"; 

//hs://base64(username:password)@lierccp.tk:443/?caddy=1&m=md5hex(admin=username)
const testingLinkStr2 = "hs://dXNlcm5hbWU6cGFzc3dvcmQ=@lierccp.tk:443/?caddy=1&m=f78f5520afea15ea5e7821bdb0600f97";

// https://caddyproxy-website-url/path/to/caddy-invite-page.html#urlencode(hs://dXNlcm5hbWU6cGFzc3dvcmQ=@lierccp.tk:443/?caddy=1)
const testingLinkStr3 = "https://caddyproxy-website-url/path/to/caddy-invite-page.html#hs%3A%2F%2FdXNlcm5hbWU6cGFzc3dvcmQ%3D%40lierccp.tk%3A443%2F%3Fcaddy%3D1";


// https://caddyproxy-website-url/path/to/caddy-invite-page.html#urlencode(hs://dXNlcm5hbWU6cGFzc3dvcmQ=@lierccp.tk:443/?caddy=1&m=f78f5520afea15ea5e7821bdb0600f97)
const testingLinkStr4 = "https://caddyproxy-website-url/path/to/caddy-invite-page.html#hs%3A%2F%2FdXNlcm5hbWU6cGFzc3dvcmQ%3D%40lierccp.tk%3A443%2F%3Fcaddy%3D1%26m%3Df78f5520afea15ea5e7821bdb0600f97";



// https://caddyproxy-website-url/path/to/caddy-invite-page.html#urlencode(hs://dXNlcm5hbWU6cGFzc3dvcmQ=@lierccp.tk:443/?caddy=1&m=f78f5520afea15ea5e7821bdb0600f91)
const testingLinkStr5 = "https://caddyproxy-website-url/path/to/caddy-invite-page.html#hs%3A%2F%2FdXNlcm5hbWU6cGFzc3dvcmQ%3D%40lierccp.tk%3A443%2F%3Fcaddy%3D1%26m%3Df78f5520afea15ea5e7821bdb0600f91";



let ret = false;
ret = urlParser.parseLinkStr(testingLinkStr1);
console.log('parse testingLinkStr1 result is ' + ret);
console.log('download url is :' + urlParser.getDownloadUrl());
console.log('admin '+ urlParser.getAdminFlag());
console.log('host is ' + urlParser.getProxyHost());
console.log('port is ' + urlParser.getProxyPort());
console.log('pwd is ' + urlParser.getProxyPwd());
console.log('user is ' + urlParser.getProxyUser());

console.log('++++++++++++++++++++');

ret = urlParser.parseLinkStr(testingLinkStr2);
console.log('parse result is ' + ret);
console.log('download url is :' + urlParser.getDownloadUrl());
console.log('admin '+ urlParser.getAdminFlag());
console.log('host is ' + urlParser.getProxyHost());
console.log('port is ' + urlParser.getProxyPort());
console.log('pwd is ' + urlParser.getProxyPwd());
console.log(urlParser.getProxyUser());

console.log('++++++++++++++++++++');


ret = urlParser.parseLinkStr(testingLinkStr3);
console.log('parse result is ' + ret);
console.log('download url is :' + urlParser.getDownloadUrl());
console.log('admin '+ urlParser.getAdminFlag());
console.log('host is ' + urlParser.getProxyHost());
console.log('port is ' + urlParser.getProxyPort());
console.log('pwd is ' + urlParser.getProxyPwd());
console.log('user is ' + urlParser.getProxyUser());

console.log('++++++++++++++++++++');

ret = urlParser.parseLinkStr(testingLinkStr4);
console.log('parse result is ' + ret);
console.log('download url is :' + urlParser.getDownloadUrl());
console.log('admin '+ urlParser.getAdminFlag());
console.log('host is ' + urlParser.getProxyHost());
console.log('port is ' + urlParser.getProxyPort());
console.log('pwd is ' + urlParser.getProxyPwd());
console.log('user is ' + urlParser.getProxyUser());


console.log('++++++++++++++++++++');

ret = urlParser.parseLinkStr(testingLinkStr5);
console.log('parse result is ' + ret);
console.log('download url is :' + urlParser.getDownloadUrl());
console.log('admin '+ urlParser.getAdminFlag());
console.log('host is ' + urlParser.getProxyHost());
console.log('port is ' + urlParser.getProxyPort());
console.log('pwd is ' + urlParser.getProxyPwd());
console.log('user is ' + urlParser.getProxyUser());