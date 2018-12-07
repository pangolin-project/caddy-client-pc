const http = require('http');
const fs = require('fs');
const logger = require('./logger.js');
const tls = require('tls');
const { spawn, spawnSync, exec } = require('child_process');
const path = require('path');

let  httpServer = null;
let  urlParser = null;
let  connStateGetter = null;



//callback:  to get admin password
//callbackOnOk: adjustPrivilege success callback
function adjustPrivilege(callback, callbackOnOk) {
    let adminPwd = callback();
    let input = adminPwd;
    let working_dir = path.join(__dirname).replace('app.asar', 'app.asar.unpacked');
    // let options = {
    //     'cwd' : working_dir
    // };
    try {
        let execPath = working_dir + '/sysproxy';
        exec("echo " + input + " | sudo -S chown root " + execPath, (error, stdout, stderr) => {
            logger.log("chown -> stdout: " + stdout);
            logger.log("chown -> errr: " + error);
            logger.log("chown -> stderr: " + stderr);
            logger.log("--------------------------------");
            exec("echo " + input + " | sudo -S chmod u+s " + execPath, (err, out, serr) => {
                logger.log("chmod -> stdout: " + out);
                logger.log("chmod -> errr: " + err);
                logger.log("chmod -> stderr: " + serr);
                if (!err) {
                    callbackOnOk();
                }
            });
        });
    } catch(error) {
        logger.log('exception msg!!!! :' + error);
    }
}



module.exports = {
    setParser: function(parser) {
        urlParser = parser;
    },
    setConnStateGetter: function(getter) {
        connStateGetter = getter;
    },
    //listen on localhost:8081
    startHttpServer : function () {
        if(httpServer) {
            logger.log('has started http server');
            return; 
        }
        httpServer = http.createServer();
        httpServer.on('clientError', (err, socket) => {
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        });
        httpServer.on('error', (err) => {
            if(err.code == 'EADDRINUSE') {
                logger.log('port 8081 is being used');
            } else {
                logger.log('listen error on localhost:8081');
            }
        });

        httpServer.on('connect', (req, socket, headBuffer) => {
            this.handleConnect(req, socket, headBuffer);
        });
        httpServer.on('request', (req, res) =>{
            if(req.url == '/proxy.pac') {
                logger.log('request the pac.url file....');
                try {
                    pacPath = path.join(__dirname, './proxy.pac');
                    let data = fs.readFileSync(pacPath);
                    res.write(data);
                } catch(err) {
                    logger.log('read proxy.pac failed');
                }finally{
                    res.end();
                }
            } else {
                logger.log('unknown request from local :' +  req.url);
            }
        });

        httpServer.listen(8081, 'localhost');
        isStartHttpServer = true;
        logger.log('start http proxy server success!!!');
    },
    stopHttpServer: function() {
        isStartHttpServer = false;
        if ( httpServer != null) {
            httpServer.close(()=> {
                logger.log('http proxy server closed');
            });
        }
    },
    //handle http CONNECT request
    handleConnect : function(req, socket, headBuffer) {
        let targetHost = req.url;
        let authenKey = urlParser.getBasicAuthenKey();
        let httpsReq = 'CONNECT ' + targetHost + ' HTTP/1.1\r\n';
        httpsReq += 'Host: '+ targetHost +'\r\n';
        httpsReq += 'Proxy-Connection: keep-alive\r\n';
        httpsReq += 'User-Agent:Caddy-Client\r\n';
        httpsReq += 'Proxy-Authorization: Basic '+ authenKey +'\r\n\r\n';//base64(username:password)
        logger.log('connect request for :' + targetHost + ' forward req :' + httpsReq );
        if (connStateGetter() == 'disconnected') {
            logger.log('disconnected with proxy server. sorry');
            return;
        }
        //const options;
        const options = {
            host: urlParser.getProxyHost(),
            port: urlParser.getProxyPort(),
            rejectUnauthorized :  false,
            checkServerIdentity: function(servername, cert){
                logger.log('check server name :' + servername);
                return 'undefined';
            }
        };
        const tlsSocket = tls.connect(options, () => {
            logger.log('connect proxy server success for ' + targetHost);
            tlsSocket.write(httpsReq);
        });
        //10 seconds for waiting data pipe
        tlsSocket.setTimeout(10000);
        socket.setTimeout(10000);

        tlsSocket.on('end', () => {
            tlsSocket.end();
            logger.log('tls stream closed ' + targetHost);
        });
        socket.on('end', () => {
            socket.end();
            logger.log('http stream closed  ' + targetHost);
        });
        socket.on('timeout', () => {
            socket.end();
            logger.log('http stream closed ' + targetHost);
        });
        tlsSocket.on('timeout', () => {
            tlsSocket.end();
            logger.log('tls stream closed' + targetHost);
        });

        tlsSocket.on('data', (data) => {
            try {
                socket.write(data);
            }catch(err) {
                logger.log('data tls connection disconnect '+ targetHost);
            }
            
        });

        socket.on('data', (data) => {
            try {
                tlsSocket.write(data);
            } catch (err) {
                logger.log('data http connection disconnect '+ targetHost)
            }
            
        });
    },
    setProxyConfigWin: function() {
        let working_dir = path.join(__dirname).replace('app.asar', 'app.asar.unpacked');
        logger.log('set winproxy to pac.url, work dir :'+ working_dir);
        let options = {
            cwd : working_dir,
        };
        let childProcess = spawn('winproxy.exe', ['-autoproxy', 'http://127.0.0.1:8081/proxy.pac'], options);
        childProcess.on('exit', () => {
            logger.log('execute the proxy command finished');
        });
    },
    
    //callback will be call when execute command finished
    unsetProxyConfigWin: function (callback) {
        let working_dir = path.join(__dirname).replace('app.asar', 'app.asar.unpacked');
        let options = {
            cwd : working_dir,
        };
        let childProcess = spawn('winproxy.exe', ['-unproxy'], options);
        childProcess.on('exit',  () =>{
            logger.log('exit unproxy command');
            if(callback) {
                callback();
            }
            
        });
        logger.log('unproxy ....');
    },
    //callback: get admin password
    setProxyConfigMac: function (callback) {
        let working_dir = path.join(__dirname).replace('app.asar', 'app.asar.unpacked');
        logger.log('set darwin  work dir :'+ working_dir);
        let options = {
            cwd : working_dir,
        };
        let childProcess = spawn('./sysproxy', ['on', '127.0.0.1', '8081'], options);
        childProcess.stdout.on('data', (data) => {
            logger.log('execute log :' + data);
        });
        childProcess.on('exit', (code, signal) => {
            if (code != 0) {
                logger.log('execute sysproxy set proxy failed,  code :' + code);
                adjustPrivilege(callback, () => {
                    let doProxy = spawn('./sysproxy', ['on', '127.0.0.1', '8081'], options);
                    doProxy.on('exit', (code, signal) => {
                        if (code != 0) {
                            logger.log('set proxy failed on mac os ' + code);
                        } else {
                            logger.log('set proxy success on mac os');
                        }
                    });
                });
            } else {
                logger.log('proxy darwin success');
            }
        });

    },
    unsetProxyConfigMac: function (callback) {
        let working_dir = path.join(__dirname).replace('app.asar', 'app.asar.unpacked');
        logger.log('set darwin  work dir :'+ working_dir);
        let options = {
            cwd : working_dir,
        };
        let childProcess = spawn('./sysproxy', ['off', '127.0.0.1', '8081'], options);
        childProcess.on('exit', (code, signal) => {
            if (code != 0) {
                logger.log('sysproxy unset failed code :' + code);
            } else {
                logger.log('unproxy darwin success');
            }
            callback();
        });
    },
    setProxyConfigLinux: function () {
        
    },
    unsetProxyConfigLinux: function (callback) {
        callback();
    },
    //the callback will get the admin password 
    setProxyConfig: function (callback) {
        let OS = this.getOSType();
        logger.log('set proxy on OS: '+ OS);
        if( OS == 'darwin') {
            this.setProxyConfigMac(callback);
        } else if ( OS == 'linux') {
            this.setProxyConfigLinux();
        } else if ( OS == 'win32') {
            logger.log('set win32 proxy');
            this.setProxyConfigWin();
        } else {
            logger.log('set proxy config failed ! os error');
        }
    },
    unsetProxyConfig: function (callback) {
        let OS = this.getOSType();
        if( OS == 'darwin') {
            this.unsetProxyConfigMac(callback);
        } else if ( OS == 'linux') {
            this.unsetProxyConfigLinux(callback);
        } else if ( OS == 'win32') {
            this.unsetProxyConfigWin(callback);
        } else {
            logger.log('set unproxy config failed ! os error');
        }
    },
    getOSType: function () {
        return process.platform;
    }
}