/**
 * WebGL2 Perlin Flow Field Renderer
 */
import type { FlowFieldConfig, FlowFieldRenderer } from "./types";

const SIMULATION_VS = /* glsl */ `#version 300 es
precision highp float;

in vec2 aPosition;
in vec2 aVelocity;
in float aAge;

out vec2 vPosition;
out vec2 vVelocity;
out float vAge;

uniform vec2 uResolution;
uniform float uNoiseScale;
uniform float uForce;
uniform float uDamping;
uniform float uAngleMult;
uniform float uTimeOffset;
uniform float uMaxAge;
uniform float uSeed;
uniform vec2 uMouse;
uniform float uMouseRadius;
uniform float uMouseForce;

float fract2(float e) { return e - floor(e); }
float hash(float e) { return fract2(43758.5453123 * sin(e)); }

float noise2D(float x, float y) {
  float ix = floor(x);
  float iy = floor(y);
  float fx = fract2(x);
  float fy = fract2(y);
  float n00 = hash(ix + 57.0 * iy);
  float n10 = hash(ix + 1.0 + 57.0 * iy);
  float n01 = hash(ix + (iy + 1.0) * 57.0);
  float n11 = hash(ix + 1.0 + (iy + 1.0) * 57.0);
  float ux = fx * fx * (3.0 - 2.0 * fx);
  float uy = fy * fy * (3.0 - 2.0 * fy);
  return n00 + (n10 - n00) * ux + (n01 - n00) * uy + (n00 - n10 - n01 + n11) * ux * uy;
}

float rand(vec2 co) {
  return fract2(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float angle = noise2D(aPosition.x * uNoiseScale, aPosition.y * uNoiseScale + uTimeOffset) * uAngleMult;
  vec2 vel = aVelocity;
  vel.x += uForce * cos(angle);
  vel.y += uForce * sin(angle);

  vec2 diff = aPosition - uMouse;
  float distSq = dot(diff, diff);
  float radiusSq = uMouseRadius * uMouseRadius;
  if (distSq < radiusSq && distSq > 0.0) {
    float dist = sqrt(distSq);
    float strength = (uMouseRadius - dist) / uMouseRadius;
    float repelAngle = atan(diff.y, diff.x);
    vel.x += cos(repelAngle) * strength * uMouseForce;
    vel.y += sin(repelAngle) * strength * uMouseForce;
  }

  vel *= uDamping;
  vec2 pos = aPosition + vel;
  float age = aAge + 1.0;

  if (pos.x < 0.0 || pos.x > uResolution.x || pos.y < 0.0 || pos.y > uResolution.y || age > uMaxAge) {
    pos.x = rand(vec2(aPosition.x + uSeed, aAge)) * uResolution.x;
    pos.y = rand(vec2(aPosition.y + uSeed, aAge + 1.0)) * uResolution.y;
    vel = vec2(0.0);
    age = 0.0;
  }

  vPosition = pos;
  vVelocity = vel;
  vAge = age;
}
`;

const SIMULATION_FS = /* glsl */ `#version 300 es
precision highp float;
out vec4 fragColor;
void main() { fragColor = vec4(0.0); }
`;

const PARTICLE_VS = /* glsl */ `#version 300 es
precision highp float;
in vec2 aPosition;
uniform vec2 uResolution;
uniform float uParticleSize;
void main() {
  vec2 clipPos = (aPosition / uResolution) * 2.0 - 1.0;
  clipPos.y = -clipPos.y;
  gl_Position = vec4(clipPos, 0.0, 1.0);
  gl_PointSize = uParticleSize;
}
`;

const PARTICLE_FS = /* glsl */ `#version 300 es
precision highp float;
uniform float uDark;
out vec4 fragColor;
void main() {
  fragColor = uDark > 0.5 ? vec4(1.0, 1.0, 1.0, 0.6) : vec4(0.0, 0.0, 0.0, 0.7);
}
`;

const FADE_VS = /* glsl */ `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FADE_FS = /* glsl */ `#version 300 es
precision highp float;
uniform float uFadeAlpha;
uniform float uDark;
out vec4 fragColor;
const vec3 darkBg = vec3(10.0/255.0, 15.0/255.0, 26.0/255.0);
const vec3 lightBg = vec3(250.0/255.0, 250.0/255.0, 250.0/255.0);
void main() {
  vec3 bg = uDark > 0.5 ? darkBg : lightBg;
  fragColor = vec4(bg, uFadeAlpha);
}
`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("[WebGL2] Shader compile:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vsSource: string,
  fsSource: string,
  attribBindings?: Record<string, number>,
  tfVaryings?: string[],
): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);

  if (attribBindings) {
    for (const [name, loc] of Object.entries(attribBindings)) {
      gl.bindAttribLocation(program, loc, name);
    }
  }
  if (tfVaryings) {
    gl.transformFeedbackVaryings(program, tfVaryings, gl.INTERLEAVED_ATTRIBS);
  }

  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("[WebGL2] Link:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

const STRIDE = 20;
const LOC_POSITION = 0;
const LOC_VELOCITY = 1;
const LOC_AGE = 2;

export class WebGL2FlowField implements FlowFieldRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private config: FlowFieldConfig | null = null;
  private simulationProgram: WebGLProgram | null = null;
  private renderProgram: WebGLProgram | null = null;
  private fadeProgram: WebGLProgram | null = null;

  private particleBuffers: [WebGLBuffer | null, WebGLBuffer | null] = [null, null];
  private simVAOs: [WebGLVertexArrayObject | null, WebGLVertexArrayObject | null] = [null, null];
  private renderVAOs: [WebGLVertexArrayObject | null, WebGLVertexArrayObject | null] = [null, null];
  private tf: WebGLTransformFeedback | null = null;
  private fadeVAO: WebGLVertexArrayObject | null = null;
  private fadeQuadBuffer: WebGLBuffer | null = null;

  private currentBuffer = 0;
  private animationId: number | null = null;
  private paused = false;
  private time = 0;
  private mouseX = -1000;
  private mouseY = -1000;

  private uSim: Record<string, WebGLUniformLocation | null> = {};
  private uRender: Record<string, WebGLUniformLocation | null> = {};
  private uFade: Record<string, WebGLUniformLocation | null> = {};

  async init(canvas: HTMLCanvasElement, config: FlowFieldConfig): Promise<boolean> {
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) return false;

    this.gl = gl;
    this.canvas = canvas;
    this.config = config;

    const simAttribs = {
      aPosition: LOC_POSITION,
      aVelocity: LOC_VELOCITY,
      aAge: LOC_AGE,
    };
    const renderAttribs = { aPosition: LOC_POSITION };

    this.simulationProgram = createProgram(gl, SIMULATION_VS, SIMULATION_FS, simAttribs, [
      "vPosition",
      "vVelocity",
      "vAge",
    ]);
    if (!this.simulationProgram) return false;

    this.renderProgram = createProgram(gl, PARTICLE_VS, PARTICLE_FS, renderAttribs);
    if (!this.renderProgram) return false;

    this.fadeProgram = createProgram(gl, FADE_VS, FADE_FS, {
      aPosition: LOC_POSITION,
    });
    if (!this.fadeProgram) return false;

    this.cacheUniforms();

    this.fadeVAO = gl.createVertexArray();
    this.fadeQuadBuffer = gl.createBuffer();
    gl.bindVertexArray(this.fadeVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.fadeQuadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(LOC_POSITION);
    gl.vertexAttribPointer(LOC_POSITION, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.tf = gl.createTransformFeedback();

    this.setupBuffers(canvas.width, canvas.height);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.clearToBackground();

    return true;
  }

  private clearToBackground() {
    if (!this.gl || !this.config) return;
    const gl = this.gl;
    if (this.config.dark) {
      gl.clearColor(10 / 255, 15 / 255, 26 / 255, 1.0);
    } else {
      gl.clearColor(250 / 255, 250 / 255, 250 / 255, 1.0);
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  private cacheUniforms() {
    if (!this.gl) return;
    const gl = this.gl;

    for (const name of [
      "uResolution",
      "uNoiseScale",
      "uForce",
      "uDamping",
      "uAngleMult",
      "uTimeOffset",
      "uMaxAge",
      "uSeed",
      "uMouse",
      "uMouseRadius",
      "uMouseForce",
    ]) {
      this.uSim[name] = gl.getUniformLocation(this.simulationProgram!, name);
    }
    for (const name of ["uResolution", "uParticleSize", "uDark"]) {
      this.uRender[name] = gl.getUniformLocation(this.renderProgram!, name);
    }
    for (const name of ["uFadeAlpha", "uDark"]) {
      this.uFade[name] = gl.getUniformLocation(this.fadeProgram!, name);
    }
  }

  private createParticleData(width: number, height: number): Float32Array {
    if (!this.config) return new Float32Array(0);
    const data = new Float32Array(this.config.particleCount * 5);
    for (let i = 0; i < this.config.particleCount; i++) {
      const off = i * 5;
      data[off] = Math.random() * width;
      data[off + 1] = Math.random() * height;
      data[off + 2] = 0;
      data[off + 3] = 0;
      data[off + 4] = Math.random() * this.config.maxAge;
    }
    return data;
  }

  private setupBuffers(width: number, height: number) {
    if (!this.gl || !this.config) return;
    const gl = this.gl;

    for (let i = 0; i < 2; i++) {
      if (this.particleBuffers[i]) gl.deleteBuffer(this.particleBuffers[i]);
      if (this.simVAOs[i]) gl.deleteVertexArray(this.simVAOs[i]);
      if (this.renderVAOs[i]) gl.deleteVertexArray(this.renderVAOs[i]);
    }

    const particleData = this.createParticleData(width, height);

    for (let i = 0; i < 2; i++) {
      const buf = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, particleData, gl.DYNAMIC_DRAW);
      this.particleBuffers[i] = buf;
    }

    for (let i = 0; i < 2; i++) {
      const buf = this.particleBuffers[i]!;

      const simVAO = gl.createVertexArray()!;
      gl.bindVertexArray(simVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(LOC_POSITION);
      gl.vertexAttribPointer(LOC_POSITION, 2, gl.FLOAT, false, STRIDE, 0);
      gl.enableVertexAttribArray(LOC_VELOCITY);
      gl.vertexAttribPointer(LOC_VELOCITY, 2, gl.FLOAT, false, STRIDE, 8);
      gl.enableVertexAttribArray(LOC_AGE);
      gl.vertexAttribPointer(LOC_AGE, 1, gl.FLOAT, false, STRIDE, 16);
      this.simVAOs[i] = simVAO;

      const renderVAO = gl.createVertexArray()!;
      gl.bindVertexArray(renderVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(LOC_POSITION);
      gl.vertexAttribPointer(LOC_POSITION, 2, gl.FLOAT, false, STRIDE, 0);
      this.renderVAOs[i] = renderVAO;
    }

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.currentBuffer = 0;
  }

  start() {
    const frame = () => {
      if (!this.gl || !this.config || !this.canvas || !this.tf) return;
      const gl = this.gl;

      if (!this.paused) {
        this.time++;
        const timeOffset = this.time * this.config.timeSpeed;
        const src = this.currentBuffer;
        const dst = 1 - src;

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(this.fadeProgram);
        gl.uniform1f(this.uFade.uFadeAlpha!, this.config.fadeAlpha);
        gl.uniform1f(this.uFade.uDark!, this.config.dark ? 1.0 : 0.0);
        gl.bindVertexArray(this.fadeVAO);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.useProgram(this.simulationProgram);
        gl.uniform2f(this.uSim.uResolution!, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.uSim.uNoiseScale!, this.config.noiseScale);
        gl.uniform1f(this.uSim.uForce!, this.config.force);
        gl.uniform1f(this.uSim.uDamping!, this.config.damping);
        gl.uniform1f(this.uSim.uAngleMult!, this.config.angleMult);
        gl.uniform1f(this.uSim.uTimeOffset!, timeOffset);
        gl.uniform1f(this.uSim.uMaxAge!, this.config.maxAge);
        gl.uniform1f(this.uSim.uSeed!, Math.random() * 1000);
        gl.uniform2f(this.uSim.uMouse!, this.mouseX, this.mouseY);
        gl.uniform1f(this.uSim.uMouseRadius!, this.config.mouseRadius);
        gl.uniform1f(this.uSim.uMouseForce!, this.config.mouseForce);

        gl.bindVertexArray(this.simVAOs[src]);

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tf);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.particleBuffers[dst]);

        gl.enable(gl.RASTERIZER_DISCARD);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, this.config.particleCount);
        gl.endTransformFeedback();
        gl.disable(gl.RASTERIZER_DISCARD);

        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

        if (this.config.dark) {
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        } else {
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }
        gl.useProgram(this.renderProgram);
        gl.uniform2f(this.uRender.uResolution!, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.uRender.uParticleSize!, this.config.particleSize);
        gl.uniform1f(this.uRender.uDark!, this.config.dark ? 1.0 : 0.0);

        gl.bindVertexArray(this.renderVAOs[dst]);
        gl.drawArrays(gl.POINTS, 0, this.config.particleCount);
        gl.bindVertexArray(null);

        this.currentBuffer = dst;
      }

      this.animationId = requestAnimationFrame(frame);
    };
    frame();
  }

  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  updateMouse(x: number, y: number) {
    this.mouseX = x;
    this.mouseY = y;
  }

  updateTheme(dark: boolean) {
    if (this.config) {
      this.config.dark = dark;
      this.clearToBackground();
    }
  }

  resize(width: number, height: number) {
    if (!this.canvas || !this.gl) return;
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
    this.setupBuffers(width, height);
    this.clearToBackground();
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  destroy() {
    this.stop();
    if (this.gl) {
      const gl = this.gl;
      for (let i = 0; i < 2; i++) {
        if (this.particleBuffers[i]) gl.deleteBuffer(this.particleBuffers[i]);
        if (this.simVAOs[i]) gl.deleteVertexArray(this.simVAOs[i]);
        if (this.renderVAOs[i]) gl.deleteVertexArray(this.renderVAOs[i]);
      }
      if (this.tf) gl.deleteTransformFeedback(this.tf);
      if (this.fadeVAO) gl.deleteVertexArray(this.fadeVAO);
      if (this.fadeQuadBuffer) gl.deleteBuffer(this.fadeQuadBuffer);
      if (this.simulationProgram) gl.deleteProgram(this.simulationProgram);
      if (this.renderProgram) gl.deleteProgram(this.renderProgram);
      if (this.fadeProgram) gl.deleteProgram(this.fadeProgram);
    }
    this.gl = null;
    this.canvas = null;
  }
}
