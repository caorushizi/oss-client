import { useEffect, useRef } from "react";
import type { OrbScene, OrbTheme } from "./scene-orb-renderer";

type SceneOrbProps = OrbTheme & { active?: boolean };

export function SceneOrb({
  hue,
  offsetX,
  offsetY,
  active = true,
}: SceneOrbProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<OrbScene | null>(null);
  const themeRef = useRef({ hue, offsetX, offsetY });
  const activeRef = useRef(active);

  useEffect(() => {
    themeRef.current = { hue, offsetX, offsetY };
    sceneRef.current?.setTheme(themeRef.current);
  }, [hue, offsetX, offsetY]);

  useEffect(() => {
    activeRef.current = active;
    // The outgoing page carries its last frame while CSS slides the page away.
    // Only the active page spends GPU time on the continuing node animation.
    sceneRef.current?.setPlayback({ playing: active });
  }, [active]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;

    // Keep Three.js out of the main application bundle and React's render loop.
    void import("./scene-orb-renderer")
      .then(({ createOrbScene }) => {
        if (!disposed) {
          sceneRef.current = createOrbScene(host, themeRef.current, {
            playing: activeRef.current,
          });
        }
      })
      .catch((error: unknown) => {
        if (!disposed) console.warn("Orb background unavailable", error);
      });

    return () => {
      disposed = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  return <div ref={hostRef} className="scene-orb" aria-hidden="true" />;
}
