# local
If you struggle with installation follow this instruction to enable Bluetooth:
https://www.npmjs.com/package/@stoprocent/bleno

If you uses a Bluetooth adapter, buy the compactable one:
https://github.com/sandeepmistry/node-bluetooth-hci-socket#compatible-bluetooth-40-usb-adapters

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

1. Raspberry OS (Linux) - OK by using ASUS BT400 adapter
```
yarn install
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
yarn start
```



