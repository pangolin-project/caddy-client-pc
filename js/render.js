
//this module will run in directory which is same with mainpage.html
const {ipcRenderer, clipboard} = require('electron');
const console = require('console'); 
const logger = require('../js/logger.js');
const messages = require('../js/messages.js');
const urlParser = require('../js/url_parser');
const prompt = require('electron-prompt');


//values: connected , disconnected
let connectionState = 'disconnected';

function setConnectionState(state) {
    logger.log('init state :' + state);
    if( state == 'connected') {
        $('#disconnected-img').attr('src', '../html/images/disconnected.png');
        $('#connected-img').attr('src', '../html/images/connected-2.png');
    } else {
        $('#disconnected-img').attr('src', '../html/images/disconnected-2.png');
        $('#connected-img').attr('src', '../html/images/connected.png');
    }
    connectionState = state;
}


function sendAsyncMsg(msg) {
    ipcRenderer.send('async-msg', msg);
}


function processMsgReply(msg) {
    logger.log('get msg reply '+ msg.type);
    if( msg.type == messages.MSG_TYPE_CONNECT_RET) {
        if(msg.param == 0) {
            //success
            setConnectionState('connected');
            logger.log('connect proxy server success!!')
            return;
        } else {
            //error
            setConnectionState('disconnected');
            logger.log('connect proxy server failed ' + msg.param);
        }
    } else if (msg.type == messages.MSG_TYPE_LOG) {
        logger.log(msg.log);
    }
}




function processMessages() {
    ipcRenderer.on('msg-reply', (event, args) =>{
        processMsgReply(args);
    });

}



function onClickConnection() {
    let msg ;
    if (connectionState == 'disconnected') {
        let url = decodeURIComponent($('#connect-url').val()).trim();
        logger.log('connect url is :' + url);
        msg = messages.buildMsg(messages.MSG_TYPE_CONNECT, url);
        sendAsyncMsg(msg);
    } else if (connectionState == 'connected') {
        msg = messages.buildMsg(messages.MSG_TYPE_DISCONNECT, '');
        sendAsyncMsg(msg);
        setConnectionState('disconnected');
    } else {
        logger.log('connection state is error :' + connectionState);
    }
    
}

function onClickShare() {
   let linkStr = decodeURIComponent($('#connect-url').val());
   if( !urlParser.parseLinkStr(linkStr) ) {
       logger.log('can not share, format is error');
       return;
   }
   $('#share-input').val(urlParser.getShareLinkStr());
}

function onClickCp() {
    let url = $('#share-input').val();
    clipboard.writeText(url);
}

function onClickQuit() {
    logger.log('click quit button');
    let msg = messages.buildMsg(messages.MSG_TYPE_QUIT, 0);
    sendAsyncMsg(msg);
}



function onClickSave() {
    let linkStr = decodeURIComponent($('#connect-url').val());
    if( !urlParser.parseLinkStr(linkStr) ) {
       alert('url格式不正确!');
       return;
    }
    let promptOptions = {
        title: '提示',
        label: '名字(不要重复):',
        value: '',
        width: 250,
        height:150,
        inputAttrs: {
            type: 'text',
            required: true
        },
        type: 'input'
    };
    prompt(promptOptions)
    .then((v) => {
        if(v === null) {
            alert('未输入保存配置的名称!');
            logger.log('user cancelled');
        } else {
            try {
                 urlParser.save(v);
                 updateProfileList();
            } catch(err) {
                 alert('保存失败! ' + err);
            }
        }
    })
    .catch(console.error);

}



function onProfileClick(ev) {
    logger.log('click:' + ev.target.id);
    let profiles = urlParser.getAllProfiles();
    for(var i in profiles) {
        if ( profiles[i].name == ev.target.id ) {
            $('#connect-url').val(profiles[i].url);
        }
    }
}
function onProfileDel(ev) {
    logger.log('del click:' + ev.target.id);
    let profileName = ev.target.id.substr(4);
    try {
        urlParser.delProfile(profileName);
        updateProfileList();
    } catch(err) {
        alert('删除失败');
    }
}

function updateProfileList() {
    logger.log('update profile list');
    $('#profiles').empty();
    let profiles = urlParser.getAllProfiles();
    for(var i in profiles) {
        var line = "<table><tr><td><div class='profile-item-1'><a id ='"+profiles[i].name+"'>"+profiles[i].name+
        "</a></div></td> <td><div class='profile-item-2'>"+profiles[i].url+
        "</div></td><td><div class='profile-item-3'><button id='btn-"+ profiles[i].name+"'></button></div></td></tr></table>";
        //logger.log('add line '+ line);
        $('#profiles').append(line);
        $('#' + profiles[i].name).bind('click', (ev) =>{onProfileClick(ev);});
        $('#btn-' + profiles[i].name).bind('click', (ev) =>{onProfileDel(ev);});
        $('#btn-' + profiles[i].name).addClass('del-btn');
    } 
    
    
}



function initProfileUIList(){
    updateProfileList();
    let profiles = urlParser.getAllProfiles();
    if (profiles.length > 0) {
        let firstLine = profiles[0];
        logger.log('set connect url :' + firstLine.url);
        $('#connect-url').val(firstLine.url);
    } else {
        logger.log('no url record in file');
    }
}

function  onClickMinimize() {
    logger.log('click minimize');
    sendAsyncMsg(messages.buildMsg(messages.MSG_TYPE_MINIMIZE, ''));
}

function showTipOverDom(ev, text) {
    var top = $('#' + ev.target.id).offset().top;
    var left = $('#' + ev.target.id).offset().left;
    var posLeft = left;
    var posTop = top - 20;   
    var tip = $("<div id='tips' style='width:60px;height:20px; text-align:center; background-color:black; position:absolute; left:"+posLeft+"px; top:"+posTop+"px; '>"+text+"</div>");
    $("body").append(tip);
}

function hideTip(ev) {
    $("#tips").remove();
}

function getTipText(targetId) {
    if ( targetId == 'connect-button') {
        if (connectionState == 'connected') {
            return '点击断开';
        } else if (connectionState == 'disconnected') {
            return '点击连接';
        } else {
            return '错误';
        }
    } else if (targetId == 'save-button') {
        return '保存链接';
    } else if (targetId == 'share-button') {
        return '点击分享';
    } else if (targetId == 'cp-button') {
        return '复制链接';
    } else if(targetId == 'disconnected-img') {
        return "未连接";
    } else if(targetId == 'connected-img') {
        return '已连接';
    } else {
        return '错误';
    }
}

function onMouseEnter(ev) {
    var top = $('#' + ev.target.id).offset().top;
    var left = $('#' + ev.target.id).offset().left;

    showTipOverDom(ev, getTipText(ev.target.id));
}

function onMouseLeave(ev) {
    hideTip();
}



$(()=> {
    $('#connect-button').bind('click', (ev)=>{
        onClickConnection();
    });

    $('#connect-button').mouseenter((ev) =>{
        onMouseEnter(ev);
    });
    $('#connect-button').mouseleave((ev) =>{
        onMouseLeave(ev);
    });


    $('#share-button').bind('click', (ev) => {
        onClickShare();
    });

    $('#share-button').mouseenter ((ev) =>{
        onMouseEnter(ev);
    });

    $('#share-button').mouseleave((ev) =>{
        onMouseLeave(ev);
    });

    $('#cp-button').bind('click', (ev) => {
        onClickCp();
    });

    $('#cp-button').mouseenter((ev) =>{
        onMouseEnter(ev);
    });
    $('#cp-button').mouseleave( (ev) =>{
        onMouseLeave(ev);
    });

    $('#quit-button').bind('click', (ev) => {
        onClickQuit();
    });

    $('#save-button').bind('click', (ev) => {
        onClickSave();
    });

    $('#save-button').mouseenter((ev) =>{
        onMouseEnter(ev);
    });
    $('#save-button').mouseleave((ev) =>{
        onMouseLeave(ev);
    });

    $('#minimize-box').bind('click', () =>{
        onClickMinimize();
    });

    $('#disconnected-img').mouseenter((ev) =>{
        onMouseEnter(ev);
    });

    $('#disconnected-img').mouseleave((ev) =>{
        onMouseLeave(ev);
    });


    $('#connected-img').mouseenter((ev) =>{
        onMouseEnter(ev);
    });

    $('#connected-img').mouseleave((ev) =>{
        onMouseLeave(ev);
    });

    initProfileUIList();
    setConnectionState('disconnected');

    processMessages();

    process.on('uncaughtException', (reason, p) => {
        logger.log('uncaught exception : ' + reason);
    });
});