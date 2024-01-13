interface TheFile {
  name: string;
  size: number;
  lastModified: number;
}

interface TheFolder {
  name: string;
  files: TheFile[];
}

export function processFiles(files: any[]) {
  const folders: TheFolder[] = [];
  files.forEach((file) => {
    const name = file.name.split("/")[0];
    const folder = folders.find((folder) => folder.name === name);
    if (folder) {
      folder.files.push(file);
    } else {
      folders.push({
        name,
        files: [file],
      });
    }
  });
  return folders;
}
