/**
 * PerlinFlowBackground - React component that orchestrates
 * the Perlin flow field with WebGPU -> WebGL2 -> Canvas 2D cascade.
 *
 */
import { useEffect, useRef, type JSX } from "react";
import { Canvas2DFlowField } from "./canvas2d-renderer";
import { DEFAULT_CONFIG, type FlowFieldConfig, type FlowFieldRenderer } from "./types";
import { WebGL2FlowField } from "./webgl2-renderer";
import { WebGPUFlowField } from "./webgpu-renderer";

type RendererType = "auto" | "webgpu" | "webgl2" | "canvas2d";

function getIsDark(): boolean {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark") return true;
  if (attr === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;";
  return canvas;
}

const PerlinFlowBackground = (): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<FlowFieldRenderer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererTypeRef = useRef<string>("none");
  const resizeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let destroyed = false;

    let currentForce: RendererType = "auto";
    try {
      const saved = localStorage.getItem("renderer");
      if (saved === "webgpu" || saved === "webgl2" || saved === "canvas2d") {
        currentForce = saved as RendererType;
      }
    } catch {}

    const makeConfig = (): FlowFieldConfig => ({
      ...DEFAULT_CONFIG,
      dark: getIsDark(),
    });

    const replaceCanvas = (): HTMLCanvasElement => {
      if (canvasRef.current) {
        canvasRef.current.remove();
      }
      const fresh = createCanvas(window.innerWidth, window.innerHeight);
      container.appendChild(fresh);
      canvasRef.current = fresh;
      return fresh;
    };

    const destroyRenderer = () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
      rendererTypeRef.current = "none";
    };

    const initRenderer = async (force: RendererType = "auto") => {
      destroyRenderer();

      const config = makeConfig();

      if (force === "webgpu" || force === "auto") {
        if (typeof navigator !== "undefined" && navigator.gpu) {
          const canvas = replaceCanvas();
          const webgpu = new WebGPUFlowField();
          if (await webgpu.init(canvas, { ...config, particleCount: 600 })) {
            if (destroyed) {
              webgpu.destroy();
              return;
            }
            rendererRef.current = webgpu;
            rendererTypeRef.current = "webgpu";
            console.debug("[Background] Using WebGPU renderer");
            webgpu.start();
            return;
          }
          webgpu.destroy();
        }
        if (force === "webgpu") {
          console.warn("[Background] WebGPU not available");
        }
      }

      if (force === "webgl2" || force === "auto") {
        if (typeof WebGL2RenderingContext !== "undefined") {
          const canvas = replaceCanvas();
          const webgl2 = new WebGL2FlowField();
          if (await webgl2.init(canvas, { ...config, particleCount: 450 })) {
            if (destroyed) {
              webgl2.destroy();
              return;
            }
            rendererRef.current = webgl2;
            rendererTypeRef.current = "webgl2";
            console.debug("[Background] Using WebGL2 renderer");
            webgl2.start();
            return;
          }
          webgl2.destroy();
        }
        if (force === "webgl2") {
          console.warn("[Background] WebGL2 not available");
        }
      }

      if (force === "canvas2d" || force === "auto") {
        const canvas = replaceCanvas();
        const canvas2d = new Canvas2DFlowField();
        if (await canvas2d.init(canvas, config)) {
          if (destroyed) {
            canvas2d.destroy();
            return;
          }
          rendererRef.current = canvas2d;
          rendererTypeRef.current = "canvas2d";
          console.debug("[Background] Using Canvas 2D renderer");
          canvas2d.start();
          return;
        }
        canvas2d.destroy();
      }

      console.warn("[Background] No renderer available");
    };

    initRenderer(currentForce);

    const handleThemeChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.dark === "boolean") {
        rendererRef.current?.updateTheme(detail.dark);
      }
    };
    window.addEventListener("themeChange", handleThemeChange);

    const darkMQ = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemTheme = () => {
      const saved = (() => {
        try {
          return localStorage.getItem("theme");
        } catch {
          return null;
        }
      })();
      if (!saved || (saved !== "dark" && saved !== "light")) {
        document.documentElement.setAttribute("data-theme", darkMQ.matches ? "dark" : "light");
        rendererRef.current?.updateTheme(darkMQ.matches);
      }
    };
    darkMQ.addEventListener("change", handleSystemTheme);

    const handleForceRenderer = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.renderer === "string") {
        currentForce = detail.renderer as RendererType;
        initRenderer(currentForce);
      }
    };
    window.addEventListener("forceRenderer", handleForceRenderer);

    const motionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    const checkMotion = () => {
      rendererRef.current?.setPaused(motionMQ.matches);
    };
    const motionTimer = window.setTimeout(checkMotion, 100);
    const handleMotionChange = (e: MediaQueryListEvent) => {
      rendererRef.current?.setPaused(e.matches);
    };
    motionMQ.addEventListener("change", handleMotionChange);

    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = window.setTimeout(() => {
        rendererRef.current?.resize(window.innerWidth, window.innerHeight);
      }, 250);
    };
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      rendererRef.current?.updateMouse(e.clientX, e.clientY);
    };
    const handleMouseLeave = () => {
      rendererRef.current?.updateMouse(-1000, -1000);
    };
    window.addEventListener("mousemove", handleMouseMove);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        rendererRef.current?.updateMouse(touch.clientX, touch.clientY);
      }
    };
    const handleTouchEnd = () => {
      rendererRef.current?.updateMouse(-1000, -1000);
    };
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchstart", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      destroyed = true;
      window.removeEventListener("themeChange", handleThemeChange);
      darkMQ.removeEventListener("change", handleSystemTheme);
      window.removeEventListener("forceRenderer", handleForceRenderer);
      motionMQ.removeEventListener("change", handleMotionChange);
      window.removeEventListener("resize", handleResize);
      window.clearTimeout(motionTimer);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchstart", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      destroyRenderer();
      if (canvasRef.current) {
        canvasRef.current.remove();
        canvasRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} />;
};

export default PerlinFlowBackground;
