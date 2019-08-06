import {html, IoElement} from "../../io.js";
import {IoThemeSingleton} from "./theme.js";

// TODO: document and test

const renderQueue = new Array();
const animate = function() {
  requestAnimationFrame(animate);
  for (let i = renderQueue.length; i--;) {
    const element = renderQueue[i];
    if (!element.$.img.loading) {
      renderQueue.splice(renderQueue.indexOf(element), 1);
      element.render();
    }
  }
};
requestAnimationFrame(animate);

function queueRender(element) {
  if (renderQueue.indexOf(element) === -1) {
    renderQueue.push(element);
  }
}

const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl', {antialias: false, premultipliedAlpha: true});
gl.imageSmoothingEnabled = false;

gl.getExtension('OES_standard_derivatives');

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.disable(gl.DEPTH_TEST);

const positionBuff = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuff);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,0.0,-1,-1,0.0,1,-1,0.0,1,1,0.0]), gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

const uvBuff = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, uvBuff);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,1,0,0,1,0,1,1]), gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

const indexBuff = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuff);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([3,2,1,3,1,0]), gl.STATIC_DRAW);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuff);

const shadersCache = new WeakMap();
let currentProgram;

export class IoGl extends IoElement {
  static get Style() {
    return html`<style>
      :host {
        overflow: hidden !important;
        position: relative !important;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
      }
      :host > img {
        top: 0;
        left: 0;
        position: absolute !important;
        pointer-events: none;
        image-rendering: pixelated;
      }
    </style>`;
  }
  static get Properties() {
    return {
      size: [0, 0],
      color: [1, 1, 1, 1],
      aspect: 1,
      pxRatio: 1,
      css: Object,
    };
  }
  static get Vert() {
    return /* glsl */`
      attribute vec3 position;
      attribute vec2 uv;
      varying vec2 vUv;

      void main(void) {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }\n\n`;
  }
  static get GlUtils() {
    return /* glsl */`
    #ifndef saturate
      #define saturate(v) clamp(v, 0., 1.)
    #endif

    vec2 translate(vec2 samplePosition, vec2 xy){
      return samplePosition - vec2(xy.x, xy.y);
    }
    vec2 translate(vec2 samplePosition, float x, float y){
      return samplePosition - vec2(x, y);
    }
    float circle(vec2 samplePosition, float radius){
      return saturate(length(samplePosition) - radius);
    }
    float rectangle(vec2 samplePosition, vec2 halfSize){
      vec2 edgeDistance = abs(samplePosition) - halfSize;
      float outside = length(max(edgeDistance, 0.));
      float inside = min(max(edgeDistance.x, edgeDistance.y), 0.);
      return saturate((outside + inside) * 2.0);
    }
    float grid(vec2 samplePosition, float gridWidth, float gridHeight, float lineWidth) {
      vec2 sp = samplePosition / vec2(gridWidth, gridHeight);
      float hw = lineWidth / 2.0;
      float linex = abs(fract(sp.x - 0.5) - 0.5) / abs(dFdx(sp.x)) - hw;
      float liney = abs(fract(sp.y - 0.5) - 0.5) / abs(dFdy(sp.y)) - hw;
      return saturate(min(linex, liney) * 2.0);
    }
    float checker(vec2 samplePosition, float size) {
      vec2 checkerPos = floor(samplePosition / size);
      float checkerMask = mod(checkerPos.x + mod(checkerPos.y, 2.0), 2.0);
      return checkerMask;
    }\n\n`;
  }
  static get Frag() {
    return /* glsl */`
      varying vec2 vUv;
      void main(void) {
        vec2 px = uSize * vUv;
        px = mod(px, 8.0);
        gl_FragColor = uColor;
        if (px.x <= 1.0 || px.y <= 1.0) gl_FragColor = vec4(vUv, 0.0, 1.0);
      }\n\n`;
  }
  initPropertyUniform(name, property) {
    if (property.notify) {
      switch (property.type) {
        case Boolean:
          return 'uniform int ' + name + ';\n';
        case Number:
          return 'uniform float ' + name + ';\n';
        case Array:
          this._vecLengths[name] = property.value.length;
          return 'uniform vec' + property.value.length + ' ' + name + ';\n';
        default:
      }
      // TODO: implement matrices.
    }
    return '';
  }
  initShader() {
    let frag = `
    #extension GL_OES_standard_derivatives : enable
    precision highp float;\n`;

    for (let name in this.css.__properties) {
      const property = this.css.__protoProperties[name];
      frag += this.initPropertyUniform(name, property);
    }

    frag += '\n';

    for (let prop in this.__properties) {
      const name = 'u' + prop.charAt(0).toUpperCase() + prop.slice(1);
      const property = this.__protoProperties[prop];
      frag += this.initPropertyUniform(name, property);
    }

    for (let i = this.__protochain.length; i--;) {
      const constructor = this.__protochain[i].constructor;
      const glUtilsProp = Object.getOwnPropertyDescriptor(constructor, 'GlUtils');
      if (glUtilsProp && glUtilsProp.get) {
        frag += constructor.GlUtils;
      }
    }

    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, this.constructor.Vert);
    gl.compileShader(vertShader);

    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
      let compilationLog = gl.getShaderInfoLog(vertShader);
      console.error('IoGl [Vertex Shader] ' + this.localName + ' error:');
      console.warn(compilationLog);
    }

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, frag + this.constructor.Frag);
    gl.compileShader(fragShader);

    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      let compilationLog = gl.getShaderInfoLog(fragShader);
      console.error('IoGl [Frament Shader] ' + this.localName + ' error:');
      console.warn(compilationLog);
    }

    const shader = gl.createProgram();
    gl.attachShader(shader, vertShader);
    gl.attachShader(shader, fragShader);

    return shader;
  }
  constructor(props) {
    super(props);

    this.css = IoThemeSingleton;

    this._vecLengths = {};
    for (let name in this.css.__properties) {
      const property = this.css.__protoProperties[name];
      if (property.notify && property.type === Array) {
        this._vecLengths[name] = property.value.length;
      }
    }
    for (let prop in this.__properties) {
      const name = 'u' + prop.charAt(0).toUpperCase() + prop.slice(1);
      const property = this.__protoProperties[prop];
      if (property.notify && property.type === Array) {
        this._vecLengths[name] = property.value.length;
      }
    }

    if (shadersCache.has(this.constructor)) {
      this._shader = shadersCache.get(this.constructor);
    } else {
      this._shader = this.initShader();
      shadersCache.set(this.constructor, this._shader);
    }

    gl.linkProgram(this._shader);

    const position = gl.getAttribLocation(this._shader, "position");
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuff);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(position);

    const uv = gl.getAttribLocation(this._shader, "uv");
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuff);
    gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(uv);

    this.template([['img', {id: 'img'}]]);

    this.render = this.render.bind(this);

    this.$.img.onload = () => { this.$.img.loading = false; };

    this.updateCssUniforms();
  }
  onResized() {
    const rect = this.getBoundingClientRect();
    const borderWidth = parseFloat(getComputedStyle(this).borderTopWidth); // TODO: FF bug borderWidth resolves empty string.
    const pxRatio = window.devicePixelRatio;
    const width = Math.ceil((rect.width - borderWidth * 2) * pxRatio);
    const height = Math.ceil((rect.height - borderWidth * 2) * pxRatio);

    this.setProperties({
      size: [width, height],
      aspect: width / height,
      pxRatio: pxRatio,
    });
  }
  cssMutated() {
    this.updateCssUniforms();
    queueRender(this);
  }
  changed() {
    queueRender(this);
  }
  render() {
    const width = this.size[0];
    const height = this.size[1];


    if (!width || !height) return;

    this.setShaderProgram();

    // TODO: dont brute-force uniform update.
    for (let p in this.__properties) {
      const name = 'u' + p.charAt(0).toUpperCase() + p.slice(1);
      this.updatePropertyUniform(name, this.__properties[p]);
    }

    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    this.$.img.src = canvas.toDataURL('image/png', 0.9);
    this.$.img.loading = true;
  }
  setShaderProgram() {
    if (currentProgram !== this._shader) {
      currentProgram = this._shader;
      gl.useProgram(this._shader);
    }
  }
  updatePropertyUniform(name, property) {
    this.setShaderProgram();
    if (property.notify) {
      this.setUniform(name, property.type, property.value);
    }
  }
  updateCssUniforms() {
    for (let name in this.css.__properties) {
      this.updatePropertyUniform(name, this.css.__properties[name]);
    }
  }
  setUniform(name, type, value) {
    const uniform = gl.getUniformLocation(this._shader, name);
    let _c;
    switch (type) {
      case Boolean:
        gl.uniform1i(uniform, value ? 1 : 0);
        break;
      case Number:
        gl.uniform1f(uniform, value !== undefined ? value : 1);
        break;
      case Array:
        _c = [0, 1, 2, 3];
        if (!(value instanceof Array) && typeof value === 'object') {
          if (value.x !== undefined) _c = ['x', 'y', 'z', 'w'];
          else if (value.r !== undefined) _c = ['r', 'g', 'b', 'a'];
          else if (value.h !== undefined) _c = ['h', 's', 'v', 'a'];
          else if (value.c !== undefined) _c = ['c', 'm', 'y', 'k'];
        }
        switch (this._vecLengths[name]) {
          case 2:
            if (value === undefined) {
              gl.uniform2f(uniform, 0, 0);
              break;
            }
            gl.uniform2f(uniform,
                value[_c[0]] !== undefined ? value[_c[0]] : 1,
                value[_c[1]] !== undefined ? value[_c[1]] : 1);
            break;
          case 3:
            if (value === undefined) {
              gl.uniform3f(uniform, 0, 0, 0);
              break;
            }
            gl.uniform3f(uniform,
                value[_c[0]] !== undefined ? value[_c[0]] : 1,
                value[_c[1]] !== undefined ? value[_c[1]] : 1,
                value[_c[2]] !== undefined ? value[_c[2]] : 1);
            break;
          case 4:
            if (value === undefined) {
              gl.uniform4f(uniform, 0, 0, 0, 0);
              break;
            }
            gl.uniform4f(uniform,
                value[_c[0]] !== undefined ? value[_c[0]] : 1,
                value[_c[1]] !== undefined ? value[_c[1]] : 1,
                value[_c[2]] !== undefined ? value[_c[2]] : 1,
                value[_c[3]] !== undefined ? value[_c[3]] : 1);
                break;
          default:
        }
        break;
      default:
    }
  }
}

IoGl.Register();
