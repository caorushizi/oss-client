import Store from "electron-store";

export const store = new Store<ISettings>({
  defaults: {
    serverConfig: { ab: 123 },
    language: "123"
  }
});

interface ISettings {
  serverConfig: {
    ab: number;
  };
  language: string;
}

const a = store.get("serverConfig").ab;
