import { useEffect, useState } from "react";
import { KeyCode } from "../lib/enums";

const useKeyPress = (targetKeyCode: KeyCode) => {
  const [keyPressed, setKeyPressed] = useState(false);

  const keyDownHandler = ({ code }: KeyboardEvent) => {
    if (code === targetKeyCode) {
      setKeyPressed(true);
    }
  };
  const keyUpHandler = ({ code }: KeyboardEvent) => {
    if (code === targetKeyCode) {
      setKeyPressed(false);
    }
  };
  useEffect(() => {
    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);
    return () => {
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
    };
  }, []);
  return keyPressed;
};

export default useKeyPress;
