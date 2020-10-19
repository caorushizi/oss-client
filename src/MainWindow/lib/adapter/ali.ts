import mime from "mime";

export const aliAdapter: BucketAdapter = (items: any[]): BucketItem[] => {
  return items.map(item => {
    const { name } = item;
    return {
      name,
      lastModified: item.lastModified,
      webkitRelativePath: item.name,
      meta: item,
      size: item.size,
      type: mime.getType(item.name) || "",
      lastModifiedDate: new Date(item.lastModified)
    };
  });
};
