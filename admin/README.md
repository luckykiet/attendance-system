# GOKASA Admin

Multi-business administration UI for GOKASA

## Build and deployment

- the built client has to be served by GOKASA (project-ops) server on production, the following steps show how to deploy it on local development server, which can be applied the same way on production

### DEVELOPMENT

- config `/.env` file
- note that VITE_RECAPTCHA_KEY is not being used at the moment and you can safely ignore the configuration
- use same Grecaptcha Site Key from GOKASA (project-ops)
  
```
VITE_RECAPTCHA_KEY = ''
```

- Run development
    - run `project-ops` server locally to serve the back-end API
    - run `yarn dev` to run development mode for the client via vite

### PRODUCTION

- config `/.env.production` file
- note that VITE_RECAPTCHA_KEY is not being used at the moment and you can safely ignore the configuration
- use same Grecaptcha Site Key from GOKASA (project-ops)

```.env.production
VITE_RECAPTCHA_KEY = ''
```

- Build and deploy
    - run `yarn build`
    - copy `/build/*` to `~/project-ops/public/admin/` (works for both local dev and production)
