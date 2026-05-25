/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_Q_CROWD_URL?: string;
  readonly VITE_Q_INSTALLER_WINDOWS?: string;
  readonly VITE_Q_INSTALLER_MAC?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
