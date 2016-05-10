/**
 * Created by petry_000 on 08.05.2016.
 */
const $ = require('jquery');
const electron = require("electron");
const ipc = electron.ipcRenderer;

$(function() {
    console.log("renderer started");
    require("./core")(42);
    
    $(".do").click(function (e) {
        ipc.send("compiler", $(this).data("do"));
    });
});
