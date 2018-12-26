const logger = require('./logger.js');
const md5 = require('md5');
const fs = require('fs');
const path = require('path')

let proxyHost = '';
let proxyPort = 0;
let proxyUser = '';
let proxyPwd = '';
let isAdmin = false;
let adminPort = 0;
let adminUser = '';
let adminPwd = '';

let clientDownloadURL = 'https://github.com/pangolin-project/pangolin-client-pc/releases/download/v1.0.4/pangolin_client-win32-ia32.zip';
const saveFilePath = path.join(__dirname, "/config.dat").replace('app.asar', 'app.asar.unpacked');

function resetInfo() {
    proxyHost = '';
    proxyPort = 0;
    proxyUser = '';
    proxyPwd = '';
    isAdmin = false;
    adminPort = 0;
    adminUser = '';
    adminPwd = '';
}

//parse : base64(username:password)
function parseUserPwd(userPwdStr) {
    let userPwd = Buffer.from(userPwdStr, 'base64').toString();
    let userPwdParts =  userPwd.split(':');
    if(userPwdParts.length == 2) {
        proxyUser = userPwdParts[0];
        proxyPwd = userPwdParts[1];
        return true;
    } else {
        return false;
    }
}
//parse: ?pangolin=1&adp=13412&adm=admin&pwd=123lladllasdf
// or ?pangolin=1
function parseQueryStr(queryStr) {
    if(queryStr.indexOf('?pangolin=1&adp=') == 0) {
        let queryStr1 = queryStr.split('&');
        if (queryStr1.length == 4) {
        //?pangolin=1&adp=13412&adm=admin&pwd=123lladllasdf
            let adpPart = queryStr1[1];
            let adminPart = queryStr1[2];
            let adminPwdPart = queryStr1[3];
            adpParts = adpPart.split('=');
            if (adpParts.length != 2) {
                return false;
            } else {
                adp = adpParts[1];
                adminPort = adp;
            }
            adminParts = adminPart.split('=');
            if (adminParts.length != 2) {
                return false;
            } else {
                adminUser = adminParts[1];
                isAdmin = true;
            }
            adminPwdParts = adminPwdPart.split('=');
            if (adminPwdParts.length != 2) {
                return false;
            } else {
                adminPwd = adminPwdParts[1];
            }
            return true;
        } else {
            return false;
        }
    } else if (queryStr.indexOf('?pangolin=1') == 0) {
        isAdmin = false;
        adminPort = 0;
        return true;
    } else {
        return false;
    }
       
}


//hs://base64(username:password)@host:port/?pangolin=1&adp=13412&adm=admin&pwd=123lladllasdf   or
//hs://base64(username:password)@host:port/?pangolin=1
//return true or false
function parseProxyUrl(proxyUrl) {
    let hostParts = proxyUrl.split('@');
    resetInfo();
    if(hostParts.length == 2) {
        let userPwdBase64 = hostParts[0].substr(5); //hs://base64(username:password)
        if (!parseUserPwd(userPwdBase64)) {
            resetInfo();
            return false;
        }
        let hostStr = hostParts[1]; //host:port/?pangolin=1&adp=13412&adm=admin&pwd=123lladllasdf
        let hostStrParts = hostStr.split('/');
        if(hostStrParts.length == 2) {
            let hostPortStr = hostStrParts[0];//host:port
            let hostPortParts = hostPortStr.split(':');
            if(hostPortParts.length == 2) {
                proxyHost = hostPortParts[0];
                proxyPort = parseInt(hostPortParts[1], 10);
            } else {
                resetInfo();
                return false;
            }
            let queryStr = hostStrParts[1];//?pangolin=1&adp=13412&adm=admin&pwd=123lladllasdf
            if(!parseQueryStr(queryStr)) {
                resetInfo();
                return false;
            }
            return true;
        } else {
            resetInfo();
            return false;
        }
    } else {
        resetInfo();
        return false;
    }
}

module.exports = {
    //return connection string from shared url or url returned by 
    //useful part of link:
    //hs://base64(username:password)@host:port/?pangolin=1
    //share link format : 
    //https://pangolinproxy-website-url/path/to/pangolin-invitepage.html#urlencode(hs://base64(username:password)@host:port/?pangolin=1)
    //manage url:
    //hs://base64(username:password)@host:port/?pangolin=1&adp=13412&adm=admin&pwd=123lladllasdf 
    //return true or false
    parseLinkStr : function(linkStr) {
        clientDownloadURL = 'https://github.com/pangolin-project/pangolin-client-pc/releases/download/v1.0.4/pangolin_client-win32-ia32.zip';
        if (linkStr.indexOf('https://') == 0) {
            //its a share link
            let parts = linkStr.split('#');
            if (parts.length == 2) {
                clientDownloadURL = parts[0];
                proxyUrl = decodeURIComponent(parts[1]);          
                if (proxyUrl.indexOf('hs://') == 0) {
                    return parseProxyUrl(proxyUrl);
                } else {
                    return false;
                }
            } else {
                return  false;
            }
        } else if (linkStr.indexOf('hs://') == 0) {
            proxyUrl = decodeURIComponent(linkStr);
            return parseProxyUrl(proxyUrl);
        } else {
            return false;
        }
    },

    getProxyHost : function() {
        return proxyHost;
    },
    
    getProxyPort : function() {
        return proxyPort;
    },

    getProxyUser : function() {
        return proxyUser;
    },

    getProxyPwd : function() {
        return proxyPwd;
    },

    getAdminPort : function() {
        return adminPort;
    },
    getAdminUser : function() {
        return adminUser;
    },
    getAdminPwd : function() {
        return adminPwd;
    },
    getAdminAuthKey : function() {
        return Buffer.from(adminUser + ':' + adminPwd, 'utf8').toString('base64');
    },
    getBasicAuthenKey : function() {
        return Buffer.from(proxyUser+':'+proxyPwd, 'utf8').toString('base64');
    },

    getAdminFlag : function() {
        return isAdmin;
    }, 

    getDownloadUrl : function() {
        return clientDownloadURL;
    },
    getShareLinkStr : function() {
        let connectStr = this.getConnectStr();
        return clientDownloadURL + '#' + encodeURIComponent(connectStr);
    },
    //hs://base64(username:password)@host:port/?pangolin=1&adp=13412&adm=admin&pwd=123lladllasdf
    getAdminLinkStr : function() {
        let connectStr = this.getConnectStr();
        if ( isAdmin ) {
           let adminUrl = connectStr + "&adp=" + adminPort.toString(10) + "&adm=" + adminUser + "&pwd=" + adminPwd;
           return adminUrl;
        }
        return '';
    },

    getConnectStr : function() {
        let userpwd = Buffer.from(proxyUser+':'+proxyPwd).toString('base64');
        let connectStr = 'hs://' + userpwd + '@' + proxyHost + ':' + proxyPort + '/?pangolin=1';
        return connectStr;
    },

    save : function(profileName) {
        let connectStr = this.getConnectStr();
        let aLine = profileName + ' ' + connectStr + '\n';
        let profiles = this.getAllProfiles();
        let options = {
            encoding : 'utf8',
            flag : 'w'
        };
        fs.writeFileSync(saveFilePath, '', options);
        options.flag = 'as';
        fs.writeFileSync(saveFilePath, aLine, options);
        for( var i in profiles) {
            aLine = profiles[i].name + ' ' + profiles[i].url + '\n';
            fs.writeFileSync(saveFilePath, aLine, options);
        }
        return true;
    },

    //just save admin link str to config file
    saveAsAdmin : function() {
        let adminStr = this.getAdminLinkStr();
        let aLine = adminStr + '\n';
        let options = {
            encoding : 'utf8',
            flag : 'w'
        };
        fs.writeFileSync(saveFilePath, adminStr, options);
        return true;
    },

    //return profiles like [{name:'xxx', url: 'xxx'}, ...]
    getAllProfiles : function() {
       let content;
       try {
        content = fs.readFileSync(saveFilePath, 'utf8');
       } catch(err) {
           logger.log('get config file failed ' + err);
           return [];
       }
       //console.log('content:'+ content);
       let lines = content.split('\n');
       let profileArray = [];
       for(var i in lines) {
           //console.log('line:'+ lines[i]);
            if (lines[i].length > 0 && lines[i] != '\n') {
                let profile = lines[i].split(' ');
                profileArray.push({
                    name : profile[0],
                    url : profile[1]
                });
            } 
       }
       return profileArray;
    },

    getAllProfilesForAdmin : function() {
        let content;
        try {
         content = fs.readFileSync(saveFilePath, 'utf8');
        } catch(err) {
            logger.log('get config file failed ' + err);
            return [];
        }
        //console.log('content:'+ content);
        let lines = content.split('\n');
        let profileArray = [];
        for(var i in lines) {
            //console.log('line:'+ lines[i]);
             if (lines[i].length > 0 && lines[i] != '\n') {
                 profileArray.push(lines[i]);
             } 
        }
        return profileArray;
     },

    delProfile : function(profileName) {
        let profiles = this.getAllProfiles();
        logger.log('del profile:' + profileName);
        let profiles2 = [];
        for (var i in profiles) {
            if(profiles[i].name == profileName) {
                logger.log('ignore '+ profiles[i].name + " p:"+profileName);
            } else {
                profiles2.push(profiles[i]);
            }
        }
        fs.writeFileSync(saveFilePath, '', 'utf8'); //clear first
        let options = {
            encoding:'utf8',
            flag: 'as',
        };
        for(var j in profiles2) {
            let aLine = profiles2[j].name + ' ' + profiles2[j].url + '\n';
            logger.log('add a line:' + aLine);
            fs.writeFileSync(saveFilePath, aLine, options);
        }
    }
}
