module.exports = {
     MSG_TYPE_CONNECT : 'msg-type-connect', // {type: 'msg-type-connect', param: 'hs://xxxxx'}
     MSG_TYPE_DISCONNECT : 'msg-type-disconnect', // {type: 'msg-type-connect', param: ''}
     MSG_TYPE_CONNECT_RET : 'msg-type-connect-result', // {type:'msg-type-connect-result', param : 0/-1}
     MSG_TYPE_LOG : 'msg-type-log', //// {type:'msg-type-log', param : 'xxxx'}
     MSG_TYPE_QUIT : 'msg-type-quit', // {type:'msg-type-quit', param : '0/-1}
     MSG_TYPE_MINIMIZE: 'msg-type-minimize', //{type: 'msg-type-minimize', param : ''}
     buildMsg : function(msgType, param) {
         return {'type': msgType, 'param':param}
     },
     getMsgParam : function(msg) {
         return msg.param;
     }
}