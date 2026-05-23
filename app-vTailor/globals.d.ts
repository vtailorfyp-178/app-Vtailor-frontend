/// <reference types="@react-three/fiber" />

declare module '*.glb' {
  const asset: number;
  export default asset;
}

declare module '@/data/cloudinaryCatalog.json' {
  const rows: Array<{ relativePath: string; url: string; aliasOf?: string | null }>;
  export default rows;
}
