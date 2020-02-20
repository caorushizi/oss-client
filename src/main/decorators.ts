import { ipcMain } from "electron";

export function on(name: string) {
  return (
    target: Object,
    propertyName: string,
    propertyDescriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    const method = propertyDescriptor.value;
    ipcMain.on(name, method);
    return propertyDescriptor;
  };
}
