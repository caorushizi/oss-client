export function hiddenTextFilter(text: string) {
  return text.replace(/./g, "*");
}
