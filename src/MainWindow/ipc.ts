import IpcService from "./lib/service/IpcService";

const ipc = new IpcService();

export type BucketObj = {
  domains: [];
  files: [];
};
export async function switchBucket(bucketName: string): Promise<BucketObj> {
  const bucketObj = await ipc.send<BucketObj>("switch-bucket", {
    params: bucketName
  });
  return bucketObj;
}
