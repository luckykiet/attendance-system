# local
If you struggle with installation follow this instruction to enable Bluetooth:
https://www.npmjs.com/package/@stoprocent/bleno

If you uses a Bluetooth adapter, buy the compactable one:
https://github.com/sandeepmistry/node-bluetooth-hci-socket#compatible-bluetooth-40-usb-adapters

- ensure NodeJS >= 20.4.0 installed
- clone this folder

1. MacOS - OK
```
yarn install
yarn start
```

2. Windows - not working
```
yarn install
yarn start
```

1. Raspberry OS (Linux) - OK
```
sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev libusb-1.0-0-dev
sudo hciconfig hci0 up
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)

yarn install
yarn start
```



