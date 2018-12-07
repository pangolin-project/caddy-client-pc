const {BrowserWindow, app} = require('electron');
const path =  require('path');
const {ipcMain} = require('electron');
const logger = require('./logger.js');
const messages = require('./messages.js');
const urlParser =  require('./url_parser.js');
const tls = require('tls');
const proxy = require('./proxy.js');
let adminPwd = '';

let mainWindow = null;
let connState = 'disconnected'; // disconnected, connected

function sendReplyMsg(event, msg) {
    event.sender.send('msg-reply', msg);
}

function setConnectState(state) {
    connState = state;
    if (state == 'disconnected') {
        proxy.unsetProxyConfig(()=>{
            logger.log('unproxy finished');
        });
    } else if (state == 'connected') {
        proxy.setProxyConfig( () => {
            return adminPwd;
        });
    }
}

function tryToConnect(event, url) {
    let options = {
        host : urlParser.getProxyHost(),
        port : urlParser.getProxyPort(),
        rejectUnauthorized :  false,
        checkServerIdentity: function(servername, cert) {
            logger.log('check server name :' + servername);
            return 'undefined';
        }
    };
    try {
        let tlsSocket = tls.connect(options, () => {
            logger.log('connect to proxy server success!!!!!');
            setConnectState('connected');
            proxy.setParser(urlParser);
            proxy.setConnStateGetter(() =>{
                return connState;
            });
            sendReplyMsg(event, messages.buildMsg(messages.MSG_TYPE_CONNECT_RET, 0));
        });
        tlsSocket.setTimeout(10000);
        tlsSocket.on('timeout', () => {
            logger.log('tls connection timeout!');
            tlsSocket.end();
        });
        tlsSocket.on('end', () => {
            logger.log('tls connection remote ended!');
            tlsSocket.end();
        });
    } catch(err) {
        sendReplyMsg(event, messages.buildMsg(messages.MSG_TYPE_CONNECT_RET, -1));
        logger.log('connect error ' + url);
    }
    
}



function onConnectMsg(event, url) {
    logger.log('onConnectMsg url:' + url);
    proxy.startHttpServer();
    if (!urlParser.parseLinkStr(url)) {
        logger.log('url format is error!!!');
        let msg = messages.buildMsg(messages.MSG_TYPE_CONNECT_RET, -1);
        sendReplyMsg(event, msg);
        return;
    }
    if (connState == 'disconnected') {
        tryToConnect(event, url);
    } else if(connState == 'connected') {
        logger.log(mainWindow,' state is connected, do nothing');
    } else {
        logger.log(mainWindow,'unknown state : ' + connState);
    }
    logger.log('connect finished');
}

function onDisconnectMsg(code) {    
    logger.log('disconnect  server code :' + code);
    if( connState == 'connected') {
        setConnectState('disconnected');
    }
}

function onAsyncMsg(event, msg) {
    logger.log('receive async msg ' + msg.type);
    if(msg.type == messages.MSG_TYPE_CONNECT) {
        onConnectMsg(event, msg.param);
    } else if (msg.type == messages.MSG_TYPE_DISCONNECT) {
        onDisconnectMsg(msg.param);
    } else if (msg.type == messages.MSG_TYPE_QUIT) {
        closeWindowEx();
    } else if (msg.type == messages.MSG_TYPE_MINIMIZE) {
        mainWindow.minimize();
    }  else if (msg.type == messages.MSG_TYPE_ADMINPWD) {
        adminPwd = messages.getMsgParam(msg);
    } else {
        logger.log(mainWindow,'unknown msg '+ msg.type);
    }

}

function closeWindowEx() {
    logger.log('close window ex!!! quit ');
    proxy.stopHttpServer();
    proxy.unsetProxyConfig(() =>{
        mainWindow.close()
    });
}



module.exports = {
    createMainWindow :  function() {
        let winOptions = {
            width:635, height:411, 
            center:true, maximizable:false, 
            minimizable:true,closable:true, 
            title : 'caddy-client',
            frame : false,
            resizable: false
        }
        mainWindow = new BrowserWindow(winOptions);
        let mainPage = path.join('file://', __dirname, '../html/index.html');
        mainWindow.on('ready-to-show', ()=>{
            logger.init();
            mainWindow.show();
        }); 
        //hs%3A%2F%2FdXNlcjE6YWJjZGZm%40caddyproxy.tk%3A443%2F%3Fcaddy%3D1


        mainWindow.loadURL(mainPage);
        //for debug usage
        //OpenDebug();
        mainWindow.on('close', (ev) => {
            mainWindow = null;
        });

        process.on('uncaughtException', (reason, p) =>{
            logger.log('uncaughtException '+ reason);
        });
        
    },

    closeWindow :  function() {
        closeWindowEx();
    },

    processMessages : function() {
        ipcMain.on('async-msg', (event, args) => {
            onAsyncMsg(event, args);
        });
    },
    OpenDebug: function() {
        mainWindow.webContents.openDevTools({mode:'detach'})
    }
}

