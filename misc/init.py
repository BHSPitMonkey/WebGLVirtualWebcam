import os
import sys
import fcntl
import timeit
import sys
import time
import numpy as np
import pyfakewebcam.v4l2 as _v4l2

video_device = os.open('/dev/video0', os.O_WRONLY | os.O_SYNC)
width = 1280
height = 720

if (False):
    format = _v4l2.V4L2_PIX_FMT_RGB32
    bpp = 4
else:
    format = _v4l2.V4L2_PIX_FMT_YUYV
    bpp = 2

settings = _v4l2.v4l2_format()
settings.type = _v4l2.V4L2_BUF_TYPE_VIDEO_OUTPUT
settings.fmt.pix.pixelformat = format
settings.fmt.pix.width = width
settings.fmt.pix.height = height
settings.fmt.pix.field = _v4l2.V4L2_FIELD_NONE
settings.fmt.pix.bytesperline = width * bpp
settings.fmt.pix.sizeimage = width * height * bpp
settings.fmt.pix.colorspace = _v4l2.V4L2_COLORSPACE_JPEG

buffer = np.zeros((settings.fmt.pix.height, bpp*settings.fmt.pix.width), dtype=np.uint8)

print(_v4l2.VIDIOC_S_FMT)

by = bytes(settings)
for byte in by:
    print(byte)

hexstr = bytes(settings).hex()
for i in range(len(hexstr)):
    if i % 32 == 0:
        print('')
    if i % 2 == 0:
        print('0x' + hexstr[i] + hexstr[i+1], end=', ')

print('')

print(bytes(settings).hex())
exit()
print(fcntl.ioctl(video_device, _v4l2.VIDIOC_S_FMT, settings))
while True: time.sleep(1) # Keep the fd open
