# WebGL Virtual Webcam

To prepare:

```bash
# Dependencies for GPU.js native module
sudo apt install libx11-dev libxkbfile-dev libxkbfile-dev libxext-dev libxi-dev mesa-common-dev

# Set the node version and install npm packages
nvm use
npm install

# For more info about this, see: https://www.electronjs.org/docs/tutorial/using-native-node-modules
./node_modules/.bin/electron-rebuild -o ioctl
```

To start:

```bash
sudo modprobe v4l2loopback devices=1 card_label="WebGL Virtual Webcam" # Only need to run this once
```

(Verify whether /dev/video0 is the loopback device, and modify source if it isn't)

```bash
npm run dev
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
