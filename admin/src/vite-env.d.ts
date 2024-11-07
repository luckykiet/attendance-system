/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
interface ImportMetaEnv {
    readonly VITE_RECAPTCHA_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}