'use strict'

import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'
import VirtualCamera from '../VirtualCamera.mjs'

const isDevelopment = process.env.NODE_ENV !== 'production'

// Create the Virtual Camera
const camera = new VirtualCamera();
console.log('VirtualCamera created:', camera);

// IPC event handler that receives new frame buffers from the renderer
ipcMain.on('new-frame', (_event, arg) => {
  // arg should be a UInt8Array
  camera.writeFrame(arg);
});

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

function createMainWindow() {
  const window = new BrowserWindow({
    title: 'WebGL Virtual Webcam',
    width: 800,
    height: 480,
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

app.allowRendererProcessReuse = true; // This makes a deprecation notice shut up

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
