"use strict";

import { GPU } from "gpu.js";
import css from "./index.css";

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

//const pixels = new Uint8Array(1280 * 720 * 4);

// Temporary 3D cube just to get something on the canvas

/*============= Creating a canvas =================*/
const canvasContainer = document.createElement("div");
canvasContainer.setAttribute("class", "canvas-container");
document.body.appendChild(canvasContainer);
const width = 1280;
const height = 720;
const canvas = document.createElement("canvas");
canvas.id = "canvas";
canvas.setAttribute("width", width);
canvas.setAttribute("height", height);
canvasContainer.appendChild(canvas);

const pixelCount = width * height;

/** @type {WebGL2RenderingContext} */
const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });

function fastRgbaToYuyv() {
  const gpu = new GPU({
    canvas,
    context: gl,
    mode: "webgl2",
  });
  window.gpu = gpu; // For debugging
  const convertPixels = gpu
    .createKernel(function (a) {
      return a;
    })
    .setOutput([1280 * 720 * 2]);
  // TODO: Get this working (r1 + g1 + b1) / 3
}

function slowRgbaToYuyv() {
  /** @type {Uint8Array} window.rgbaPixels */
  for (let i = 0; i < pixelCount; i += 2) {
    // Read 2 pixels (4 bytes, rgba) from rgbaPixels (ignore alpha)
    let rgbaOffset = i * 4;
    let r1 = window.rgbaPixels[rgbaOffset];
    let g1 = window.rgbaPixels[rgbaOffset + 1];
    let b1 = window.rgbaPixels[rgbaOffset + 2];
    let r2 = window.rgbaPixels[rgbaOffset + 4];
    let g2 = window.rgbaPixels[rgbaOffset + 5];
    let b2 = window.rgbaPixels[rgbaOffset + 6];

    // Build 2 pixels (4 bytes yuyv) for yuyvPixels
    let cb = 127; // TODO: Determine a Cb to share for both pixels based on RGB mix
    let cr = 127; // TODO: Determine a Cr to share for both pixels based on RGB mix
    let y1 = (r1 + g1 + b1) / 3; // TODO: Do this right
    let y2 = (r1 + g1 + b1) / 3; // TODO: Do this right
    let yuyvOffset = i * 2;
    window.yuyvPixels[yuyvOffset] = y1;
    window.yuyvPixels[yuyvOffset + 1] = cb;
    window.yuyvPixels[yuyvOffset + 2] = y2;
    window.yuyvPixels[yuyvOffset + 3] = cr;
  }
}

/*============ Defining and storing the geometry =========*/

// prettier-ignore
const vertices = [
   -1,-1,-1, 1,-1,-1, 1, 1,-1, -1, 1,-1,
   -1,-1, 1, 1,-1, 1, 1, 1, 1, -1, 1, 1,
   -1,-1,-1, -1, 1,-1, -1, 1, 1, -1,-1, 1,
   1,-1,-1, 1, 1,-1, 1, 1, 1, 1,-1, 1,
   -1,-1,-1, -1,-1, 1, 1,-1, 1, 1,-1,-1,
   -1, 1,-1, -1, 1, 1, 1, 1, 1, 1, 1,-1, 
];

// prettier-ignore
const colors = [
   5,3,7, 5,3,7, 5,3,7, 5,3,7,
   1,1,3, 1,1,3, 1,1,3, 1,1,3,
   0,0,1, 0,0,1, 0,0,1, 0,0,1,
   1,0,0, 1,0,0, 1,0,0, 1,0,0,
   1,1,0, 1,1,0, 1,1,0, 1,1,0,
   0,1,0, 0,1,0, 0,1,0, 0,1,0
];

// prettier-ignore
const indices = [
   0,1,2, 0,2,3, 4,5,6, 4,6,7,
   8,9,10, 8,10,11, 12,13,14, 12,14,15,
   16,17,18, 16,18,19, 20,21,22, 20,22,23 
];

// Create and store data into vertex buffer
var vertex_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

// Create and store data into color buffer
var color_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

// Create and store data into index buffer
var index_buffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
gl.bufferData(
  gl.ELEMENT_ARRAY_BUFFER,
  new Uint16Array(indices),
  gl.STATIC_DRAW
);

/*=================== Shaders =========================*/

var vertCode =
  "attribute vec3 position;" +
  "uniform mat4 Pmatrix;" +
  "uniform mat4 Vmatrix;" +
  "uniform mat4 Mmatrix;" +
  "attribute vec3 color;" + //the color of the point
  "varying vec3 vColor;" +
  "void main(void) { " + //pre-built function
  "gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);" +
  "vColor = color;" +
  "}";

var fragCode =
  "precision mediump float;" +
  "varying vec3 vColor;" +
  "void main(void) {" +
  "gl_FragColor = vec4(vColor, 1.);" +
  "}";

var vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, vertCode);
gl.compileShader(vertShader);

var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, fragCode);
gl.compileShader(fragShader);

var shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertShader);
gl.attachShader(shaderProgram, fragShader);
gl.linkProgram(shaderProgram);

/* ====== Associating attributes to vertex shader =====*/
var Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix");
var Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix");
var Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix");

gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
var position = gl.getAttribLocation(shaderProgram, "position");
gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);

// Position
gl.enableVertexAttribArray(position);
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
var color = gl.getAttribLocation(shaderProgram, "color");
gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);

// Color
gl.enableVertexAttribArray(color);
gl.useProgram(shaderProgram);

/*==================== MATRIX =====================*/

function get_projection(angle, a, zMin, zMax) {
  var ang = Math.tan((angle * 0.5 * Math.PI) / 180); //angle*.5

  // prettier-ignore
  return [
      0.5/ang, 0 , 0, 0,
      0, 0.5*a/ang, 0, 0,
      0, 0, -(zMax+zMin)/(zMax-zMin), -1,
      0, 0, (-2*zMax*zMin)/(zMax-zMin), 0 
   ];
}

var proj_matrix = get_projection(40, canvas.width / canvas.height, 1, 100);

// prettier-ignore
var mov_matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
// prettier-ignore
var view_matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

// translating z
view_matrix[14] = view_matrix[14] - 6; //zoom

/*==================== Rotation ====================*/

function rotateZ(m, angle) {
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  var mv0 = m[0],
    mv4 = m[4],
    mv8 = m[8];

  m[0] = c * m[0] - s * m[1];
  m[4] = c * m[4] - s * m[5];
  m[8] = c * m[8] - s * m[9];

  m[1] = c * m[1] + s * mv0;
  m[5] = c * m[5] + s * mv4;
  m[9] = c * m[9] + s * mv8;
}

function rotateX(m, angle) {
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  var mv1 = m[1],
    mv5 = m[5],
    mv9 = m[9];

  m[1] = m[1] * c - m[2] * s;
  m[5] = m[5] * c - m[6] * s;
  m[9] = m[9] * c - m[10] * s;

  m[2] = m[2] * c + mv1 * s;
  m[6] = m[6] * c + mv5 * s;
  m[10] = m[10] * c + mv9 * s;
}

function rotateY(m, angle) {
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  var mv0 = m[0],
    mv4 = m[4],
    mv8 = m[8];

  m[0] = c * m[0] + s * m[2];
  m[4] = c * m[4] + s * m[6];
  m[8] = c * m[8] + s * m[10];

  m[2] = c * m[2] - s * mv0;
  m[6] = c * m[6] - s * mv4;
  m[10] = c * m[10] - s * mv8;
}

/*================= Drawing ===========================*/
let time_old = 0;

const animate = function (time) {
  // Rotate the cube
  const dt = time - time_old;
  rotateZ(mov_matrix, dt * 0.0005); //time
  rotateY(mov_matrix, dt * 0.0002);
  rotateX(mov_matrix, dt * 0.0003);
  time_old = time;

  // Prepare the canvas for this frame
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0.5, 0.5, 0.7, 1);
  gl.clearDepth(1.0);

  // Draw the scene
  gl.viewport(0.0, 0.0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
  gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
  gl.uniformMatrix4fv(Mmatrix, false, mov_matrix);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

  // TODO: Do the camera capture + bodyPix segmentation + virtual background stuff
  // Food for thought: That stuff need only happen here (instead of in the main node process) if we
  // care about the live preview in our window (which to be fair, we probably do?)
  // Maybe it's worth considering compositing the foreground body image with the background content
  // at the Node.js layer, but I guess it's probably easier to do here in the WebGL context anyway

  // Get the pixel contents of the canvas
  // https://www.khronos.org/registry/webgl/specs/latest/2.0/#5.36 Pixel store parameter constraints
  //console.log(gl.drawingBufferWidth, gl.drawingBufferHeight);
  var bytesLength = gl.drawingBufferWidth * gl.drawingBufferHeight * 4;
  //   var pixels = new Uint8Array(
  //     bytesLength // 3 bytes per pixel (8 bits per channel)
  //   );

  // Warning from: https://www.khronos.org/registry/webgl/specs/latest/2.0/#3.7.10
  // This is a blocking operation, as WebGL must completely finish all previous rendering operations into the source framebuffer in order to return a result. In multi-process WebGL implementations, it also incurs an expensive inter-process round-trip to fetch the result from the remote process.
  // Consider instead using readPixels into a PIXEL_PACK_BUFFER. Use getBufferSubData to read the data from that buffer. (See getBufferSubData for how to avoid blocking in that call.)

  gl.readPixels(
    0,
    0,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    window.rgbaPixels
  );

  //var start = 240000 * 4;

  //console.log(pixels[start + 0], pixels[start + 1], pixels[start + 2]); // Uint8Array

  // By default this pixels array should match up with V4L2_PIX_FMT_RGB32 but I'm not certain.
  // It also might still be advantageous to convert it into a more space-efficient format to lessen the amount
  // of copying to and from the loopback device and into the consumer, but this is just a theory.
  //window.pixelsWereWritten();

  //ipcRenderer.send("new-frame", pixels);

  // Convert the pixels to YUYV
  // See V4L2 formats: http://www.hep.by/gnu/kernel/media/pixfmt.html
  // TODO
  slowRgbaToYuyv();

  // Send the YUYV frame back to the main process
  window.sendNewFrame();

  // Schedule the next call to this function
  // TODO: We may not actually want to use RAF and instead have an old-fashioned timer,
  // so the app window can be hidden / minimized to tray during capture
  window.requestAnimationFrame(animate);
};
animate(0); // Animate the first frame
