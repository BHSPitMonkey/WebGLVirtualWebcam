const { GPU, input } = require('gpu.js');

// RGBA pixels
// Every 4 bytes represents 1 pixel
// 1 byte represents 1 channel (R, G, B, A)
// prettier-ignore
let rgbaPixels = new Uint8Array([
    255, 255, 255, 255, // White
    127, 255, 255, 255,
    0, 255, 0, 255, // Green
    0, 0, 0, 255,  // Black
    255, 255, 255, 255, // White
    127, 255, 255, 255,
    0, 255, 0, 255, // Green
    0, 0, 0, 255,  // Black
]);
// prettier-ignore
rgbaPixels = new Uint8Array([
    255, 255, 255, 255, // White
    255, 255, 255, 255, // White
    255, 255, 255, 255, // White
    255, 255, 255, 255, // White
    255, 255, 255, 255, // White
    255, 255, 255, 255, // White
    255, 255, 255, 255, // White
    255, 255, 255, 255, // White
]);
console.log(rgbaPixels);
const pixelCount = rgbaPixels.length / 4;
console.log(`Input has ${pixelCount} pixels (${rgbaPixels.length} bytes)`);

// 32-bit view of rgba buffer (every element represents 4 pixels)
var rgba32View = new Uint32Array(rgbaPixels.buffer);
console.log(`rgba32View has ${rgba32View.length} elements`);
console.log(rgba32View);

// Output expectation:
// YUYV pixels
// Every 4 bytes represents 2 pixels
// https://www.kernel.org/doc/html/latest/media/uapi/v4l/pixfmt-yuyv.html

const f = function (a) {
  this.thread.x;
  return a[this.thread.x];
};

const gpu = new GPU({mode:'cpu'});
const convertPixels = gpu.createKernel(f).setOutput([pixelCount / 2]);

var o = convertPixels(rgba32View);
var yuvBytes = new Uint8Array(o.buffer);
console.log(yuvBytes);

function debugPrintYuv(input) {
    // input should be Uint8Array

    var formattedBytes = Array.from(input).map(byte => byte.toString().padStart(3, '0'));
    console.log(`YUYV data (${input.length / 2} pixels)`);
    console.log(
      "Y'  Cb  Y'  Cr     Y'  Cb  Y'  Cr     Y'  Cb  Y'  Cr     Y'  Cb  Y'  Cr  "
    );
    for (i = 0; i < input.length / 16; i++) {
        let offset = i * 16;
        let line = '';
        for (j = 0; j < input.length / 4; j++) {
            line += `${formattedBytes[offset + j]} ${
              formattedBytes[offset + j + 1]
            } ${formattedBytes[offset + j + 1]} ${
              formattedBytes[offset + j + 1]
            }    `;
        }
        console.log(line);
    }
}
debugPrintYuv(yuvBytes);
// for (i=0; i<yuvBytes.length / 4; i++) {
//     console.log(yuvBytes[i], yuvBytes[i+1], yuvBytes[i+2], yuvBytes[i+3]);
// }
//console.log(new Uint8Array(o.buffer));