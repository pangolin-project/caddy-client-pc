const fs = require('fs');
var elog = require('electron-log');


module.exports = {
    init : function() {
        elog.transports.file.level = 'verbose';
        elog.transports.file.format = '{h}:{i}:{s}:{ms} {text}';
        // Set approximate maximum log size in bytes. When it exceeds,
        // the archived log will be saved as the log.old.log file
        elog.transports.file.maxSize = 5 * 1024 * 1024;
        
        // Write to this file, must be set before first logging
        elog.transports.file.file = __dirname + '/log.txt';
        
        // fs.createWriteStream options, must be set before first logging
        // you can find more information at
        // https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options
        elog.transports.file.streamConfig = { flags: 'w' };
        
        // set existed file stream
        elog.transports.file.stream = fs.createWriteStream('log.txt');
    },
    //log: log string
    log : function(log) {
        elog.log(log);
    },
    
}