# local
If you struggle with installation follow this instruction to enable Bluetooth:
https://www.npmjs.com/package/@stoprocent/bleno

1. MacOS - OK
```
yarn install
yarn start
```

2. Windows - not tested
```
yarn install
yarn start
```

3. Raspberry OS (Linux) - in test (still not working)
```
yarn install
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
yarn start
```



