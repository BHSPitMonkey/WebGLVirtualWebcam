'use strict'

import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { format as formatUrl } from 'url'
//const ioctl = require("ioctl");

const isDevelopment = process.env.NODE_ENV !== 'production'
if (isDevelopment) {
  // TODO: Move into .env
  process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
}


/// TODO: Wrap all of the v4l2 business logic into a standalone module/class
const device = fs.openSync("/dev/video0", "w");

// TODO: Initialize using VIDIOC_S_FMT
// https://www.npmjs.com/package/ioctl
// Ref: https://github.com/jremmons/pyfakewebcam/blob/master/pyfakewebcam/pyfakewebcam.py#L56
// Python: VIDIOC_S_FMT = _IOWR('V', 5, v4l2_format)
// Currently cheating using pyfakewebcam: run the script first

let safeToWrite = true;
ipcMain.on("new-frame", (event, arg) => {
  // arg should be a UInt8Array
  //console.log("Got new frame: " + arg[0], arg[240000 * 4]);

  // Great, now we have a RGBA pixel buffer. Time to send it to the loopback device!
  // Ref: https://github.com/jremmons/pyfakewebcam/blob/master/pyfakewebcam/pyfakewebcam.py
  // Ref: https://www.kernel.org/doc/html/v4.14/media/uapi/v4l/vidioc-g-fmt.html
  // TODO: VIDIOC_S_FMT
  if (safeToWrite) {
    safeToWrite = false;
    fs.write(device, arg, (err, written, buffer) => {
      //console.log(err, written);
      safeToWrite = true;
    });
  } else {
    console.log("Skipped frame while waiting for write callback");
  }
});
/// END TODO


// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

function createMainWindow() {
  const window = new BrowserWindow({
    title: 'WebGL Virtual Webcam',
    width: 800,
    height: 600,
    webPreferences: {
      // Below is where we specify our preload script. __dirname points to our source file's path and the preload
      // path should point to the Webpack-emitted preload bundle.
      // Note that if you're using TypeScript, the emitted preload bundle will be in JS with a .js extension.
      preload: path.resolve(
        __dirname,
        "..",
        "..",
        "dist",
        "main",
        "preload.js"
      ),
    },
  });

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  }
  else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }))
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

app.allowRendererProcessReuse = true;

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow()
})
