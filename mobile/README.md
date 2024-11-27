# mobile

Mobile app for ATTENDANCE SYSTEM

App icon created from:
https://flowbite.com/icons/

# Development

- Prepare
    - Expo SDK 52
    - Node.js 20.4.0 or higher
        - `npm install --global yarn eas-cli`
- Install
    - `git clone [this repo]`
    - `yarn install`
- Start the project in development mode
    - `yarn start` (if your phone and your PC are in the same network)
    - `yarn start-tunnel` (if your phone and your PC are on different networks)
    - open the app in Expo Go

# Deployment

- To publish an update (minor changes)
    - increment field `$.expo.extra.update` in `app.json`
    - run `eas update --branch main`
    - test the update by re-opening the app twice
- To create a new build (major changes)
    - run `eas build --platform all`
- To deploy
    - method 1
        - download builds at https://expo.dev/accounts/luckykiet/builds
        - upload to Google Play Console and App Store Connect
    - method 2
        - `eas submit -p android`
        - `eas submit -p ios`
    - method 3
        - `eas build --platform android --auto-submit`
        - `eas build --platform ios --auto-submit`
- To create an APK
    - run `eas build -p android --profile apk` (see `eas.json` file)

