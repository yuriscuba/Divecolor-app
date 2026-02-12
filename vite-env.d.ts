/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_LIMITE_IA_DIARIO: string;
  readonly VITE_MODO_APP: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
