/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_Q_API_URL?: string;
  readonly VITE_Q_CROWD_LAN_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
