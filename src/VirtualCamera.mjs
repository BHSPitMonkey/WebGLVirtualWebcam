"use strict";

const fs = require("fs");
const ioctl = require("ioctl");

const VIDIOC_S_FMT = 0xc0d05605;

/**
 * Hard-coded v4l2_format C struct specifying YUYV (4:2:2) at 1280x720
 *
 * TODO: Define the v4l2_format struct properly using the ref-struct module, as
 * demonstrated in the ioctl module's README
 *
 * settings = _v4l2.v4l2_format()
 * settings.type = _v4l2.V4L2_BUF_TYPE_VIDEO_OUTPUT
 * settings.fmt.pix.pixelformat = V4L2_PIX_FMT_YUYV
 * settings.fmt.pix.width = 1280
 * settings.fmt.pix.height = 720
 * settings.fmt.pix.field = _v4l2.V4L2_FIELD_NONE
 * settings.fmt.pix.bytesperline = 1280 * 2
 * settings.fmt.pix.sizeimage = 1280 * 720 * 2
 * settings.fmt.pix.colorspace = _v4l2.V4L2_COLORSPACE_JPEG
 */
// prettier-ignore
const v4l2Format = new Uint8Array([
  0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05, 0x00, 0x00, 0xd0, 0x02, 0x00, 0x00, 
  0x59, 0x55, 0x59, 0x56, 0x01, 0x00, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x20, 0x1c, 0x00, 
  0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
])

export default class {
  /**
   * @param {string} device Path to the v4l2loopback device, e.g. /dev/video0
   * @param {number} width Ignored for now, defaults to 1280
   * @param {number} height Ignored for now, defaults to 720
   */
  constructor(device, width, height) {
    // If device not specified, just use the first v4l2loopback device found on system
    if (device === undefined) {
      // TODO: Move device listing/selection into a static method
      const devices = fs.readdirSync('/sys/devices/virtual/video4linux/');
      if (devices.length == 0) {
        throw new Error("No v4l2loopback devices found! Have you enabled the module using modprobe?");
      }
      device = `/dev/${devices[0]}`;
      console.log(`Automatically selecting first virtual camera (${device})`);
    }

    // Open the device
    this.device = fs.openSync(device, "w");

    // Initialize device using VIDIOC_S_FMT syscall
    // https://www.npmjs.com/package/ioctl
    // See: https://github.com/jremmons/pyfakewebcam/blob/master/pyfakewebcam/pyfakewebcam.py#L56
    const ret = ioctl(this.device, VIDIOC_S_FMT, v4l2Format);
    console.log("Ret value after initial S_FMT ioctl: ", ret);

    this.safeToWrite = true;
  }

  /**
   * Write a new frame of pixels to the device
   *
   * @param {Uint8Array} buffer A buffer of bytes representing pixels in the originally-configured format
   */
  async writeFrame(buffer) {
    if (this.safeToWrite) {
      this.safeToWrite = false;
      fs.writeSync(this.device, buffer);
      this.safeToWrite = true;
    } else {
      console.log("[VirtualCamera] Skipped frame while waiting for write callback");
    }
  }
}
