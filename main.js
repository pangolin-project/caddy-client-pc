const {app} = require('electron')
const mainWindow = require('./js/main_window')

console.log('start run ......');
app.on('ready', ()=> {
    mainWindow.createMainWindow();
});

app.on('window-all-closed', () => {
    console.log('quit ...');
    app.quit();
  });

mainWindow.processMessages();
