# WebGL Virtual Webcam

To start:

```bash
# modprobe v4l2loopback devices=1 card_label="WebGL Virtual Webcam" # Only need to run this once
```

(Verify whether /dev/video0 is the loopback device, and modify source if it isn't)

Initialize the device:

```bash
$ python3 init.py
```

And finally in another window:

```bash
$ npm run dev
```

### Development Scripts

```bash
# run application in development mode
npm run dev

# compile source code and create webpack output
npm run compile

# `npm run compile` & create build with electron-builder
npm run dist

# `npm run compile` & create unpacked build with electron-builder
npm run dist:dir
```
