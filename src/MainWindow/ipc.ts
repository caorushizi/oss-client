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

export async function getbuckets(): Promise<string[]> {
  const bucketList = await ipc.send<string[]>("get-buckets");
  return bucketList;
}
