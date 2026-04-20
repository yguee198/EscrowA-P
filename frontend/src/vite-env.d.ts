/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // and other env variables if you have them
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
