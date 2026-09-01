export function formatBytes(value: number) {
  if (!value) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const index = Math.floor(Math.log(value) / Math.log(1024));
  return `${(value / 1024 ** index).toFixed(2)}${units[index]}`;
}

export function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(
    date.getDate(),
  )}日 ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )}`;
}
