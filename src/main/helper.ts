import qiniu from "qiniu";

export function getToken(ak: string, sk: string, url: string): string {
  const mac = new qiniu.auth.digest.Mac(ak, sk);
  return qiniu.util.generateAccessToken(mac, url);
}
