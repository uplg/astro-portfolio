/**
 * WebGPU Perlin Flow Field Renderer
 */
import type { FlowFieldConfig, FlowFieldRenderer } from "./types";

const COMPUTE_SHADER = /* wgsl */ `
fn fract2(e: f32) -> f32 { return e - floor(e); }
fn hash(e: f32) -> f32 { return fract2(43758.5453123 * sin(e)); }

fn noise2D(x: f32, y: f32) -> f32 {
  let ix = floor(x);
  let iy = floor(y);
  let fx = fract2(x);
  let fy = fract2(y);

  let n00 = hash(ix + 57.0 * iy);
  let n10 = hash(ix + 1.0 + 57.0 * iy);
  let n01 = hash(ix + (iy + 1.0) * 57.0);
  let n11 = hash(ix + 1.0 + (iy + 1.0) * 57.0);

  let ux = fx * fx * (3.0 - 2.0 * fx);
  let uy = fy * fy * (3.0 - 2.0 * fy);

  return n00 + (n10 - n00) * ux + (n01 - n00) * uy + (n00 - n10 - n01 + n11) * ux * uy;
}

fn rand(co: vec2<f32>) -> f32 {
  return fract2(sin(dot(co, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

struct Params {
  width: f32,
  height: f32,
  noiseScale: f32,
  force: f32,
  damping: f32,
  angleMult: f32,
  timeOffset: f32,
  maxAge: f32,
  seed: f32,
  mouseX: f32,
  mouseY: f32,
  mouseRadius: f32,
  mouseForce: f32,
  _pad0: f32,
  _pad1: f32,
  _pad2: f32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read_write> particles: array<f32>;

@compute @workgroup_size(256)
fn simulate(@builtin(global_invocation_id) id: vec3<u32>) {
  let idx = id.x;
  let count = arrayLength(&particles) / 5u;
  if (idx >= count) { return; }

  let off = idx * 5u;
  var px = particles[off];
  var py = particles[off + 1u];
  var vx = particles[off + 2u];
  var vy = particles[off + 3u];
  var age = particles[off + 4u];

  let angle = noise2D(px * params.noiseScale, py * params.noiseScale + params.timeOffset) * params.angleMult;

  vx += params.force * cos(angle);
  vy += params.force * sin(angle);

  let dx = px - params.mouseX;
  let dy = py - params.mouseY;
  let distSq = dx * dx + dy * dy;
  let radiusSq = params.mouseRadius * params.mouseRadius;
  if (distSq < radiusSq && distSq > 0.0) {
    let dist = sqrt(distSq);
    let strength = (params.mouseRadius - dist) / params.mouseRadius;
    let repelAngle = atan2(dy, dx);
    vx += cos(repelAngle) * strength * params.mouseForce;
    vy += sin(repelAngle) * strength * params.mouseForce;
  }

  vx *= params.damping;
  vy *= params.damping;

  px += vx;
  py += vy;
  age += 1.0;

  if (px < 0.0 || px > params.width || py < 0.0 || py > params.height || age > params.maxAge) {
    px = rand(vec2<f32>(px + params.seed, age)) * params.width;
    py = rand(vec2<f32>(py + params.seed, age + 1.0)) * params.height;
    vx = 0.0;
    vy = 0.0;
    age = 0.0;
  }

  particles[off] = px;
  particles[off + 1u] = py;
  particles[off + 2u] = vx;
  particles[off + 3u] = vy;
  particles[off + 4u] = age;
}
`;

const RENDER_SHADER = /* wgsl */ `
struct RenderParams {
  width: f32,
  height: f32,
  dark: f32,
  particleSize: f32,
}

@group(0) @binding(0) var<uniform> renderParams: RenderParams;
@group(0) @binding(1) var<storage, read> particles: array<f32>;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  let off = vertexIndex * 5u;
  let px = particles[off];
  let py = particles[off + 1u];

  let x = (px / renderParams.width) * 2.0 - 1.0;
  let y = -((py / renderParams.height) * 2.0 - 1.0);

  var output: VertexOutput;
  output.position = vec4<f32>(x, y, 0.0, 1.0);

  if (renderParams.dark > 0.5) {
    output.color = vec4<f32>(1.0, 1.0, 1.0, 0.6);
  } else {
    output.color = vec4<f32>(0.0, 0.0, 0.0, 0.7);
  }

  return output;
}

@fragment
fn fs_main(@location(0) color: vec4<f32>) -> @location(0) vec4<f32> {
  return color;
}
`;

const FADE_SHADER = /* wgsl */ `
@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  var pos = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>( 1.0,  1.0),
  );
  return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}

struct FadeParams {
  fadeAlpha: f32,
  dark: f32,
  _pad0: f32,
  _pad1: f32,
}

@group(0) @binding(0) var<uniform> fadeParams: FadeParams;

@fragment
fn fs_main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
  let darkBg = vec3<f32>(10.0/255.0, 15.0/255.0, 26.0/255.0);
  let lightBg = vec3<f32>(250.0/255.0, 250.0/255.0, 250.0/255.0);
  let bg = select(lightBg, darkBg, fadeParams.dark > 0.5);
  return vec4<f32>(bg, fadeParams.fadeAlpha);
}
`;

const BLIT_SHADER = /* wgsl */ `
@group(0) @binding(0) var blitSampler: sampler;
@group(0) @binding(1) var blitTexture: texture_2d<f32>;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  var pos = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>( 1.0,  1.0),
  );
  var uvs = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(0.0, 0.0),
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(1.0, 0.0),
  );
  var output: VertexOutput;
  output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
  output.uv = uvs[vertexIndex];
  return output;
}

@fragment
fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return textureSample(blitTexture, blitSampler, uv);
}
`;

export class WebGPUFlowField implements FlowFieldRenderer {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private computePipeline: GPUComputePipeline | null = null;
  private renderPipelineAdditive: GPURenderPipeline | null = null;
  private renderPipelineAlpha: GPURenderPipeline | null = null;
  private fadePipeline: GPURenderPipeline | null = null;
  private blitPipeline: GPURenderPipeline | null = null;
  private particleBuffer: GPUBuffer | null = null;
  private computeParamsBuffer: GPUBuffer | null = null;
  private renderParamsBuffer: GPUBuffer | null = null;
  private fadeParamsBuffer: GPUBuffer | null = null;
  private computeBindGroup: GPUBindGroup | null = null;
  private renderBindGroup: GPUBindGroup | null = null;
  private fadeBindGroup: GPUBindGroup | null = null;
  private blitBindGroup: GPUBindGroup | null = null;
  private offscreenTexture: GPUTexture | null = null;
  private offscreenView: GPUTextureView | null = null;
  private config: FlowFieldConfig | null = null;
  private animationId: number | null = null;
  private paused = false;
  private time = 0;
  private canvas: HTMLCanvasElement | null = null;
  private mouseX = -1000;
  private mouseY = -1000;
  private format: GPUTextureFormat | null = null;

  async init(canvas: HTMLCanvasElement, config: FlowFieldConfig): Promise<boolean> {
    if (!navigator.gpu) return false;

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return false;

      this.device = await adapter.requestDevice();
      this.canvas = canvas;
      this.config = config;

      this.context = canvas.getContext("webgpu") as GPUCanvasContext;
      if (!this.context) return false;

      this.format = navigator.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: this.device,
        format: this.format,
        alphaMode: "premultiplied",
      });

      this.setupBuffers(canvas.width, canvas.height);
      this.setupPipelines();

      return true;
    } catch {
      return false;
    }
  }

  private createOffscreenTexture(width: number, height: number) {
    if (!this.device || !this.format) return;

    this.offscreenTexture?.destroy();

    this.offscreenTexture = this.device.createTexture({
      size: [width, height],
      format: this.format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.offscreenView = this.offscreenTexture.createView();
  }

  private setupBuffers(width: number, height: number) {
    if (!this.device || !this.config) return;

    this.particleBuffer?.destroy();
    this.computeParamsBuffer?.destroy();
    this.renderParamsBuffer?.destroy();
    this.fadeParamsBuffer?.destroy();

    this.createOffscreenTexture(width, height);

    const particleData = new Float32Array(this.config.particleCount * 5);
    for (let i = 0; i < this.config.particleCount; i++) {
      const off = i * 5;
      particleData[off] = Math.random() * width;
      particleData[off + 1] = Math.random() * height;
      particleData[off + 2] = 0;
      particleData[off + 3] = 0;
      particleData[off + 4] = Math.random() * this.config.maxAge;
    }

    this.particleBuffer = this.device.createBuffer({
      size: particleData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.particleBuffer.getMappedRange()).set(particleData);
    this.particleBuffer.unmap();

    this.computeParamsBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.renderParamsBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.fadeParamsBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private setupPipelines() {
    if (!this.device || !this.config || !this.format) return;

    const computeModule = this.device.createShaderModule({
      code: COMPUTE_SHADER,
    });
    const computeBGL = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" },
        },
      ],
    });
    this.computePipeline = this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [computeBGL],
      }),
      compute: { module: computeModule, entryPoint: "simulate" },
    });
    this.computeBindGroup = this.device.createBindGroup({
      layout: computeBGL,
      entries: [
        { binding: 0, resource: { buffer: this.computeParamsBuffer! } },
        { binding: 1, resource: { buffer: this.particleBuffer! } },
      ],
    });

    const renderModule = this.device.createShaderModule({
      code: RENDER_SHADER,
    });
    const renderBGL = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" },
        },
      ],
    });
    const renderLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [renderBGL],
    });

    this.renderPipelineAdditive = this.device.createRenderPipeline({
      layout: renderLayout,
      vertex: { module: renderModule, entryPoint: "vs_main" },
      fragment: {
        module: renderModule,
        entryPoint: "fs_main",
        targets: [
          {
            format: this.format,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one",
                operation: "add",
              },
            },
          },
        ],
      },
      primitive: { topology: "point-list" },
    });

    this.renderPipelineAlpha = this.device.createRenderPipeline({
      layout: renderLayout,
      vertex: { module: renderModule, entryPoint: "vs_main" },
      fragment: {
        module: renderModule,
        entryPoint: "fs_main",
        targets: [
          {
            format: this.format,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
            },
          },
        ],
      },
      primitive: { topology: "point-list" },
    });
    this.renderBindGroup = this.device.createBindGroup({
      layout: renderBGL,
      entries: [
        { binding: 0, resource: { buffer: this.renderParamsBuffer! } },
        { binding: 1, resource: { buffer: this.particleBuffer! } },
      ],
    });

    const fadeModule = this.device.createShaderModule({ code: FADE_SHADER });
    const fadeBGL = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
      ],
    });
    this.fadePipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [fadeBGL],
      }),
      vertex: { module: fadeModule, entryPoint: "vs_main" },
      fragment: {
        module: fadeModule,
        entryPoint: "fs_main",
        targets: [
          {
            format: this.format,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
            },
          },
        ],
      },
      primitive: { topology: "triangle-list" },
    });
    this.fadeBindGroup = this.device.createBindGroup({
      layout: fadeBGL,
      entries: [{ binding: 0, resource: { buffer: this.fadeParamsBuffer! } }],
    });

    const blitModule = this.device.createShaderModule({ code: BLIT_SHADER });
    const blitBGL = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float" },
        },
      ],
    });
    this.blitPipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [blitBGL],
      }),
      vertex: { module: blitModule, entryPoint: "vs_main" },
      fragment: {
        module: blitModule,
        entryPoint: "fs_main",
        targets: [{ format: this.format }],
      },
      primitive: { topology: "triangle-list" },
    });

    const sampler = this.device.createSampler({
      magFilter: "nearest",
      minFilter: "nearest",
    });
    this.blitBindGroup = this.device.createBindGroup({
      layout: blitBGL,
      entries: [
        { binding: 0, resource: sampler },
        { binding: 1, resource: this.offscreenView! },
      ],
    });
  }

  start() {
    const frame = () => {
      if (!this.device || !this.context || !this.config || !this.canvas || !this.offscreenView)
        return;

      if (!this.paused) {
        this.time++;
        const timeOffset = this.time * this.config.timeSpeed;

        this.device.queue.writeBuffer(
          this.computeParamsBuffer!,
          0,
          new Float32Array([
            this.canvas.width,
            this.canvas.height,
            this.config.noiseScale,
            this.config.force,
            this.config.damping,
            this.config.angleMult,
            timeOffset,
            this.config.maxAge,
            Math.random() * 1000,
            this.mouseX,
            this.mouseY,
            this.config.mouseRadius,
            this.config.mouseForce,
            0,
            0,
            0,
          ]),
        );

        this.device.queue.writeBuffer(
          this.renderParamsBuffer!,
          0,
          new Float32Array([
            this.canvas.width,
            this.canvas.height,
            this.config.dark ? 1.0 : 0.0,
            this.config.particleSize,
          ]),
        );

        this.device.queue.writeBuffer(
          this.fadeParamsBuffer!,
          0,
          new Float32Array([this.config.fadeAlpha, this.config.dark ? 1.0 : 0.0, 0, 0]),
        );

        const commandEncoder = this.device.createCommandEncoder();

        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(this.computePipeline!);
        computePass.setBindGroup(0, this.computeBindGroup!);
        computePass.dispatchWorkgroups(Math.ceil(this.config.particleCount / 256));
        computePass.end();

        const offscreenPass = commandEncoder.beginRenderPass({
          colorAttachments: [
            {
              view: this.offscreenView,
              loadOp: "load",
              storeOp: "store",
            },
          ],
        });

        offscreenPass.setPipeline(this.fadePipeline!);
        offscreenPass.setBindGroup(0, this.fadeBindGroup!);
        offscreenPass.draw(6);

        const particlePipeline = this.config.dark
          ? this.renderPipelineAdditive!
          : this.renderPipelineAlpha!;
        offscreenPass.setPipeline(particlePipeline);
        offscreenPass.setBindGroup(0, this.renderBindGroup!);
        offscreenPass.draw(this.config.particleCount);

        offscreenPass.end();

        const swapchainView = this.context.getCurrentTexture().createView();
        const blitPass = commandEncoder.beginRenderPass({
          colorAttachments: [
            {
              view: swapchainView,
              loadOp: "clear",
              clearValue: { r: 0, g: 0, b: 0, a: 1 },
              storeOp: "store",
            },
          ],
        });
        blitPass.setPipeline(this.blitPipeline!);
        blitPass.setBindGroup(0, this.blitBindGroup!);
        blitPass.draw(6);
        blitPass.end();

        this.device.queue.submit([commandEncoder.finish()]);
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
    if (this.config && this.device && this.offscreenView) {
      this.config.dark = dark;
      const encoder = this.device.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: this.offscreenView,
            loadOp: "clear",
            clearValue: dark
              ? { r: 10 / 255, g: 15 / 255, b: 26 / 255, a: 1 }
              : { r: 250 / 255, g: 250 / 255, b: 250 / 255, a: 1 },
            storeOp: "store",
          },
        ],
      });
      pass.end();
      this.device.queue.submit([encoder.finish()]);
    }
  }

  resize(width: number, height: number) {
    if (!this.canvas || !this.device || !this.context || !this.format) return;
    this.canvas.width = width;
    this.canvas.height = height;

    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: "premultiplied",
    });

    this.setupBuffers(width, height);
    this.setupPipelines();
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  destroy() {
    this.stop();
    this.particleBuffer?.destroy();
    this.computeParamsBuffer?.destroy();
    this.renderParamsBuffer?.destroy();
    this.fadeParamsBuffer?.destroy();
    this.offscreenTexture?.destroy();
    this.device?.destroy();
    this.device = null;
    this.context = null;
  }
}
