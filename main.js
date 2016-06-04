/* Created by kpmy on 08.05.2016 */
global.rerequire = require("require-new");
const Promise = require("bluebird");
const electron = require('electron');
const app = electron.app;
const ipc = electron.ipcMain;


app.on('window-all-closed', function() {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

ipc.on("compiler", function (e, a) {
    new Promise((r, e) => {
        rerequire("./compiler/owl.js")(a);
    });
});

ipc.on("loader", function (e, a) {
    var own = rerequire("./fw/own.js");
    own.load(a);
});

var mainWindow = null;

app.on('ready', function() {
    mainWindow = new electron.BrowserWindow({
        icon: "icon.png",
        title: "own",
        minWidth: 250,
        minHeight: 100,
        width: 500,
        height: 400,
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