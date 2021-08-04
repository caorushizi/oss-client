export enum AppType {
  qiniu,
  ali,
  tencent,
}

export interface App {
  type: AppType;
  name: string;
  ak: string;
  sk: string;
}

export enum AppMode {
  add,
  edit,
  view,
}
