# ATTENDENCE SYSTEM Admin

Administration UI for ATTENDENCE SYSTEM

## Build and deployment

- the built client has to be served by server on production, the following steps show how to deploy it on local development server, which can be applied the same way on production

### DEVELOPMENT

- config `/.env` file
- assign reCaptcha v3 SITE KEY into VITE_RECAPTCHA_KEY for vcap.me or localhost
  
```
VITE_RECAPTCHA_KEY = ''
```

- Run development
    - run `server` server locally to serve the back-end API
    - run `yarn dev` to run development mode for the client via vite

### PRODUCTION

- config `/.env.production` file
- assign reCaptcha v3 SITE KEY into VITE_RECAPTCHA_KEY for hostname of the website

```.env.production
VITE_RECAPTCHA_KEY = ''
```

- Build and deploy
    - run `yarn build`
    - copy `/build/*` to `~/server/public/admin/` (works for both local dev and production)
