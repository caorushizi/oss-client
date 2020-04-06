import log from "electron-log";

export function errorLog(...params: any[]) {
  log.error(params);
}

export function infoLog(...params: any[]) {
  log.info(params);
}

export function debugLog(...params: any[]) {
  log.debug(params);
}

export function warnLog(...params: any[]) {
  log.warn(params);
}
