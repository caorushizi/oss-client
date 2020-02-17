import "./index.scss";

window.onload = () => {
  console.log(123123);
  const root = document.getElementById("floatWindow");

  root!.oncontextmenu = () => {
    console.log("右键");
  };

  function openContextMenu() {
    console.log(123123);
  }
};
