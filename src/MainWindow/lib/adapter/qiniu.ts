export const qiniuAdapter: BucketAdapter = (items: any[]): BucketItem[] => {
  return items.map(item => {
    const lastModified = Math.ceil(item.putTime / 1e4);
    const name = item.key.split("/").pop();
    return {
      name,
      lastModified,
      webkitRelativePath: item.key,
      meta: item,
      size: item.fsize,
      type: item.mimeType,
      lastModifiedDate: new Date(lastModified)
    };
  });
};
