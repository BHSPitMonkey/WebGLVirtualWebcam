'use strict'

import { ipcRenderer } from 'electron'
import sourceMapSupport from "source-map-support";

window.sourceMapSupport = sourceMapSupport;

window.rgbaPixels = new Uint8Array(1280 * 720 * 4);
window.yuyvPixels = new Uint8Array(1280 * 720 * 2);
window.sendNewFrame = async function () {
  ipcRenderer.send("new-frame", window.yuyvPixels);
};

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener("DOMContentLoaded", () => {
  // const replaceText = (selector, text) => {
  //   const element = document.getElementById(selector)
  //   if (element) element.innerText = text
  // }
  // for (const type of ['chrome', 'node', 'electron']) {
  //   replaceText(`${type}-version`, process.versions[type])
  // }
  // Create a (TODO: pair of?) pixel buffer for the renderer WebGL context to write pixel data into
});

window.pixelsWereWritten = async function () {
  console.log("Got pixels!");
};
