import * as localforage from "localforage";

const store = localforage.createInstance({
  name: "store"
});

export default store;
