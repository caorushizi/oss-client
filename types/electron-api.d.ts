interface ElectronApi {
  readonly versions: Readonly<NodeJS.ProcessVersions>;
  getQiniuToken: (ak: string, sk: string, url: string) => Promise<string>;
  request: (options: RequestOptions) => Promise<any>;
}

declare interface Window {
  electron: Readonly<ElectronApi>;
  electronRequire?: NodeRequire;
}
