const useElectron = (): ElectronApi => {
  console.log("window.electron", window.electron);
  return window.electron;
};

export default useElectron;
