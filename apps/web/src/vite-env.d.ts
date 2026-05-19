/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_Q_CROWD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
