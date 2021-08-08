interface ElectronApi {
  readonly versions: Readonly<NodeJS.ProcessVersions>;
  getBuckets: (item: { name: string; ak: string; sk: string }) => Promise<any>;
}

declare interface Window {
  electron: Readonly<ElectronApi>;
  electronRequire?: NodeRequire;
}
