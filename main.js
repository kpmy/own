/**
 * Created by petry_000 on 08.05.2016.
 */
global.rerequire = require("require-new");

const electron = require('electron');
const app = electron.app;
const ipc = electron.ipcMain;


app.on('window-all-closed', function() {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

ipc.on("compiler", function (e, a) {
    rerequire("./compiler/owl.js")(a);
});

var mainWindow = null;

app.on('ready', function() {
    mainWindow = new electron.BrowserWindow({
        icon: "icon.png",
        title: "own",
        minWidth: 250,
        minHeight: 100,
        width: 400,
        height: 200,
        center: false
    });
    mainWindow.setMenu(null);

    //mainWindow.webContents.openDevTools();

    mainWindow.on('close', function (e) {
       e.preventDefault();
    });

    mainWindow.on('closed', function(e) {
        mainWindow = null;
    });

    mainWindow.loadURL('file://' + __dirname + '/render.html');

    console.log("own started");
});