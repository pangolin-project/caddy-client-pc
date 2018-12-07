const {app, Menu, clipboard, globalShortcut} = require('electron')
const mainWindow = require('./js/main_window')


function createMenu() {
    const application = {
      label: "Application",
      submenu: [
        {
          label: "About Application",
          selector: "orderFrontStandardAboutPanel:"
        },
        {
          type: "separator"
        },
        {
          label: "Quit",
          accelerator: "Command+Q",
          click: () => {
            app.quit()
          }
        }
      ]
    }
  
    const edit = {
      label: "Edit",
      submenu: [
        {
          label: "Undo",
          accelerator: "CmdOrCtrl+Z",
          selector: "undo:"
        },
        {
          label: "Redo",
          accelerator: "Shift+CmdOrCtrl+Z",
          selector: "redo:"
        },
        {
          type: "separator"
        },
        {
          label: "Cut",
          accelerator: "CmdOrCtrl+X",
          selector: "cut:"
        },
        {
          label: "Copy",
          accelerator: "CmdOrCtrl+C",
          selector: "copy:"
        },
        {
          label: "Paste",
          accelerator: "CmdOrCtrl+V",
          selector: "paste:"
        },
        {
          label: "Select All",
          accelerator: "CmdOrCtrl+A",
          selector: "selectAll:"
        }
      ]
    }
  
    const template = [
      application,
      edit
    ]
  
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
  }




console.log('start run ......');
app.on('ready', ()=> {
    mainWindow.createMainWindow();
    createMenu();
    globalShortcut.register('CommandOrControl+D', () => {
        console.log('command + d is pressed');
        mainWindow.OpenDebug();
      })
});

app.on('window-all-closed', () => {
    console.log('quit ...');
    app.quit();
  });

mainWindow.processMessages();
