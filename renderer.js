/**
 * Created by petry_000 on 08.05.2016.
 */
const electron = require("electron");
const ipcRenderer = electron.ipcRenderer;

function ping() {
    console.log(ipcRenderer.sendSync("mybus", "ping"));
    setTimeout(ping, 1000);
}

document.addEventListener('DOMContentLoaded', function(e) {
    
});
