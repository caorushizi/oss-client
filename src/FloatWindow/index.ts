import "./index.scss";
import { remote } from "electron";
import bgImg from "./bg.png";

let biasX = 0;
let biasY = 0;
const window = remote.getCurrentWindow();
const realWindow = document.getElementById("background-image");
function moveEvent(e: MouseEvent) {
  window.setPosition(e.screenX - biasX, e.screenY - biasY);
}

function fileContextMenu() {
  const menu = remote.Menu.buildFromTemplate([
    {
      label: "test",
      click: f => f
    }
  ]);
  menu.popup();
}

// todo： 背景图拖动
if (realWindow) {
  realWindow.addEventListener("mousedown", (e: MouseEvent) => {
    switch (e.button) {
      case 0:
        biasX = e.x;
        biasY = e.y;
        realWindow.addEventListener("mousemove", moveEvent);
        break;
      case 2:
        fileContextMenu();
        break;
      default:
        break;
    }
  });
  realWindow.addEventListener("mouseup", () => {
    biasX = 0;
    biasY = 0;
    realWindow.removeEventListener("mousemove", moveEvent);
  });
}

const image = document.getElementById("background-image");

if (image) image.setAttribute("src", bgImg);
if (image) image.draggable = false;
