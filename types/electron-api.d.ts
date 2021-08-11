interface ElectronApi {
  readonly versions: Readonly<NodeJS.ProcessVersions>;
  getQiniuToken: (ak: string, sk: string, url: string) => Promise<string>;
  request: <T>(options: RequestOptions) => Promise<RequestResponse<T>>;
}

declare interface Window {
  electron: Readonly<ElectronApi>;
  electronRequire?: NodeRequire;
}
