/**
 * Created by petry_000 on 08.05.2016.
 */
const electron = require('electron');
const app = electron.app;
const ipcMain = electron.ipcMain;

app.on('window-all-closed', function() {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

ipcMain.on("mybus", function (e, a) {
    e.returnValue = "pong";
});

var mainWindow = null;

app.on('ready', function() {
    mainWindow = new electron.BrowserWindow({
        icon: "icon.png",
        title: "own",
        minWidth: 250,
        minHeight: 100,
        center: false
    });
    mainWindow.setMenu(null);

    mainWindow.webContents.openDevTools();

    mainWindow.on('close', function (e) {
       //e.preventDefault();
    });

    mainWindow.on('closed', function(e) {
        mainWindow = null;
    });

    mainWindow.loadURL('file://' + __dirname + '/render.html');

    console.log("own started");
});