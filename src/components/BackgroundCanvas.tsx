import { useEffect, useRef, type JSX } from "react";
import { createNoise2D } from "simplex-noise";
import hslToHex from "hsl-to-hex";

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function map(
  n: number,
  start1: number,
  end1: number,
  start2: number,
  end2: number
) {
  return ((n - start1) / (end1 - start1)) * (end2 - start2) + start2;
}

const noise2D = createNoise2D();

class ColorPalette {
  private hue: number;
  private complimentaryHue1: number;
  private complimentaryHue2: number;
  private saturation: number = 95;
  private lightness: number = 50;
  private colorChoices: string[];

  constructor() {
    this.hue = ~~random(220, 360);
    this.complimentaryHue1 = this.hue + 30;
    this.complimentaryHue2 = this.hue + 60;

    const baseColor = hslToHex(this.hue, this.saturation, this.lightness);
    const complimentaryColor1 = hslToHex(
      this.complimentaryHue1,
      this.saturation,
      this.lightness
    );
    const complimentaryColor2 = hslToHex(
      this.complimentaryHue2,
      this.saturation,
      this.lightness
    );

    this.colorChoices = [baseColor, complimentaryColor1, complimentaryColor2];
    this.setCustomProperties();
  }

  randomColor() {
    return this.colorChoices[~~random(0, this.colorChoices.length)];
  }

  setCustomProperties() {
    document.documentElement.style.setProperty("--hue", `${this.hue}`);
    document.documentElement.style.setProperty(
      "--hue-complimentary1",
      `${this.complimentaryHue1}`
    );
    document.documentElement.style.setProperty(
      "--hue-complimentary2",
      `${this.complimentaryHue2}`
    );
  }
}

class Orb {
  private bounds: {
    x: { min: number; max: number };
    y: { min: number; max: number };
  };
  private x: number;
  private y: number;
  private scale: number;
  private radius: number;
  private xOff: number;
  private yOff: number;
  private inc: number;
  private color: string;
  private resizeHandler: (() => void) | null = null;
  private resizeTimeout: number | null = null;

  constructor(color: string) {
    this.bounds = this.setBounds();
    this.x = random(this.bounds.x.min, this.bounds.x.max);
    this.y = random(this.bounds.y.min, this.bounds.y.max);
    this.scale = 1;
    this.color = color;
    this.radius = random(window.innerHeight / 6, window.innerHeight / 3);
    this.xOff = random(0, 1000);
    this.yOff = random(0, 1000);
    this.inc = 0.002;

    this.resizeHandler = () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = window.setTimeout(() => {
        this.bounds = this.setBounds();
      }, 250);
    };
    window.addEventListener("resize", this.resizeHandler);
  }

  setBounds() {
    const maxDist =
      window.innerWidth < 1000 ? window.innerWidth / 3 : window.innerWidth / 5;
    const originX = window.innerWidth / 1.25;
    const originY =
      window.innerWidth < 1000
        ? window.innerHeight
        : window.innerHeight / 1.375;

    return {
      x: {
        min: originX - maxDist,
        max: originX + maxDist,
      },
      y: {
        min: originY - maxDist,
        max: originY + maxDist,
      },
    };
  }

  update() {
    const xNoise = noise2D(this.xOff, this.yOff);
    const yNoise = noise2D(this.yOff, this.yOff);
    const scaleNoise = noise2D(this.xOff, this.yOff);

    this.x = map(xNoise, -1, 1, this.bounds.x.min, this.bounds.x.max);
    this.y = map(yNoise, -1, 1, this.bounds.y.min, this.bounds.y.max);
    this.scale = map(scaleNoise, -1, 1, 0.5, 1);

    this.xOff += this.inc;
    this.yOff += this.inc;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = 0.825;
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, this.color + "00"); // Transparent

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  destroy() {
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
  }
}

const BackgroundCanvas = (): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbsRef = useRef<Orb[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    const resizeHandler = () => {
      resizeCanvas();
    };
    resizeHandlerRef.current = resizeHandler;
    window.addEventListener("resize", resizeHandler);

    const colorPalette = new ColorPalette();
    const orbs: Orb[] = [];

    for (let i = 0; i < 10; i++) {
      const orb = new Orb(colorPalette.randomColor());
      orbs.push(orb);
    }

    orbsRef.current = orbs;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      orbs.forEach((orb) => {
        orb.update();
        orb.render(ctx);
      });

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (resizeHandlerRef.current) {
        window.removeEventListener("resize", resizeHandlerRef.current);
      }
      orbsRef.current.forEach((orb) => orb.destroy());
      orbsRef.current = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="background-canvas-lite"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
        filter: "blur(30px)",
        opacity: 0.8,
      }}
    />
  );
};

export default BackgroundCanvas;
