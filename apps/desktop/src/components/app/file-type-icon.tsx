import { cn } from "@/lib/utils";

export function FileTypeIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  return (
    <svg className={cn("legacy-iconfont", className)} aria-hidden="true">
      <use href={`#${type}`} />
    </svg>
  );
}

export function fileIconName(filename: string) {
  const extension = filename.split(".").at(-1)?.toLowerCase();
  const icons: Record<string, string> = {
    ai: "icon-ai",
    apk: "icon-apk",
    avi: "icon-avi",
    css: "icon-css",
    scss: "icon-css",
    less: "icon-css",
    dmg: "icon-dmg",
    doc: "icon-doc",
    docx: "icon-doc",
    exe: "icon-exe",
    flv: "icon-flv",
    gif: "icon-gif",
    html: "icon-html",
    iso: "icon-iso",
    jpg: "icon-jpg",
    jpeg: "icon-jpg",
    js: "icon-js",
    jsx: "icon-js",
    ts: "icon-js",
    tsx: "icon-js",
    log: "icon-log",
    mov: "icon-mov",
    mp3: "icon-mp3",
    otf: "icon-otf",
    pdf: "icon-pdf",
    php: "icon-php",
    png: "icon-png",
    ppt: "icon-ppt",
    pptx: "icon-ppt",
    psd: "icon-psd",
    sketch: "icon-sketch",
    sql: "icon-sql",
    wav: "icon-wav",
    xls: "icon-xls",
    xlsx: "icon-xls",
    zip: "icon-zip",
  };
  return extension ? (icons[extension] ?? "icon-documents") : "icon-documents";
}
