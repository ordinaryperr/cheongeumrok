const vertexSource = `attribute vec2 position; varying vec2 uv;
void main() { uv = position; gl_Position = vec4(position, 0.0, 1.0); }`;
const fragmentSource = `precision highp float;
varying vec2 uv;
uniform sampler2D dayMap;
uniform sampler2D cloudMap;
uniform float angle;
uniform float pitch;
const float PI = 3.14159265359;
vec2 earthUV(vec3 n, float a) {
  float c = cos(0.4091), s = sin(0.4091);
  n.xy = mat2(c, -s, s, c) * n.xy;
  n.yz = mat2(cos(pitch), -sin(pitch), sin(pitch), cos(pitch)) * n.yz;
  return vec2(fract(atan(n.z, n.x) / (2.0 * PI) + 0.5 + a), asin(clamp(n.y, -1.0, 1.0)) / PI + 0.5);
}
void main() {
  vec2 p = uv / 0.82;
  float r = length(p);
  vec3 blue = vec3(0.08, 0.46, 1.0);
  if (r > 1.0) {
    gl_FragColor = vec4(blue, exp(-(r - 1.0) * 34.0) * 0.5);
    return;
  }
  vec3 n = vec3(p, sqrt(max(0.0, 1.0 - dot(p, p))));
  vec3 light = normalize(vec3(-0.65, 0.45, 1.1));
  float sun = max(dot(n, light), 0.0);
  vec3 ground = texture2D(dayMap, earthUV(n, angle)).rgb;
  float clouds = texture2D(cloudMap, earthUV(n, angle * 1.045 + 0.007)).r;
  clouds = smoothstep(0.14, 0.88, clouds) * 0.87;
  float ocean = smoothstep(0.03, 0.17, ground.b - max(ground.r, ground.g));
  vec3 color = ground * (0.08 + 1.22 * sun);
  float shine = pow(max(dot(n, normalize(light + vec3(0.0, 0.0, 1.0))), 0.0), 48.0);
  color += vec3(0.35, 0.65, 0.9) * shine * ocean * 0.35;
  color = mix(color, vec3(1.0, 0.98, 0.94) * (0.10 + sun), clouds);
  color += blue * pow(1.0 - n.z, 3.8) * (0.25 + 0.65 * sun);
  gl_FragColor = vec4(color, 1.0 - smoothstep(0.995, 1.0, r));
}`;

// A lit 3D sphere projected directly in a shader: no heavyweight scene library.
export function createEarthRenderer(canvas, { onReady, onError }) {
  const gl = canvas?.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power', premultipliedAlpha: false });
  if (!gl) { onError(); return null; }
  let disposed = false, paused = true, visible = true, loaded = false;
  let frame = 0, last = 0, rotation = 0.09;
  let tilt = 0, drag = null;
  const shaders = [], textures = [], images = [];
  let program, buffer;
  function compile(type, source) {
    const shader = gl.createShader(type);
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Earth shader failed');
    return shader;
  }
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Earth program failed');
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  } catch {
    shaders.forEach(shader => gl.deleteShader(shader));
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    onError();
    return null;
  }
  const angle = gl.getUniformLocation(program, 'angle');
  const pitch = gl.getUniformLocation(program, 'pitch');
  function draw() {
    if (!loaded || disposed || gl.isContextLost()) return;
    const size = Math.max(1, Math.min(1100, Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 1.5))));
    if (canvas.width !== size || canvas.height !== size) { canvas.width = size; canvas.height = size; }
    gl.viewport(0, 0, size, size);
    gl.uniform1f(angle, rotation);
    gl.uniform1f(pitch, tilt);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function tick(now) {
    frame = 0;
    if (paused || drag || !visible || document.hidden || disposed || !loaded) { last = 0; return; }
    if (!last) last = now;
    if (now - last >= 1000 / 30) {
      rotation += Math.min(now - last, 100) / 90000;
      last = now;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    last = 0;
    if (!disposed && loaded && visible && !document.hidden) {
      draw();
      if (!paused && !drag) frame = requestAnimationFrame(tick);
    }
  }
  function loadTexture(url, unit, uniform) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      images.push(image);
      image.onload = () => {
        if (disposed) return;
        try {
          const texture = gl.createTexture();
          textures.push(texture);
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.uniform1i(gl.getUniformLocation(program, uniform), unit);
          resolve();
        } catch (error) { reject(error); }
      };
      image.onerror = reject;
      image.src = url;
    });
  }
  function rotate(dx, dy) {
    rotation += dx / Math.max(canvas.clientWidth, 1);
    tilt = Math.max(-1.4, Math.min(1.4, tilt + dy / Math.max(canvas.clientHeight, 1) * Math.PI));
    draw();
  }
  function pointerDown(event) {
    if (!loaded || drag || !event.isPrimary || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('isDragging');
    sync();
  }
  function pointerMove(event) {
    if (!drag || drag.id !== event.pointerId) return;
    rotate(event.clientX - drag.x, event.clientY - drag.y);
    drag.x = event.clientX; drag.y = event.clientY;
  }
  function endDrag(event) {
    if (!drag || (event && event.pointerId !== drag.id)) return;
    const id = drag.id;
    drag = null;
    canvas.classList.remove('isDragging');
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    sync();
  }
  function keyDown(event) {
    const steps = { ArrowLeft: [-18, 0], ArrowRight: [18, 0], ArrowUp: [0, -18], ArrowDown: [0, 18] };
    if (!loaded || !steps[event.key]) return;
    event.preventDefault();
    rotate(...steps[event.key]);
  }
  const handlers = { pointerdown: pointerDown, pointermove: pointerMove, pointerup: endDrag, pointercancel: endDrag, lostpointercapture: endDrag, keydown: keyDown };
  Object.entries(handlers).forEach(([type, handler]) => canvas.addEventListener(type, handler));
  const blur = () => endDrag();
  window.addEventListener('blur', blur);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (!visible) endDrag(); sync(); });
  observer.observe(canvas);
  const resize = new ResizeObserver(draw);
  resize.observe(canvas);
  document.addEventListener('visibilitychange', sync);
  const contextLost = (event) => { event.preventDefault(); cancelAnimationFrame(frame); loaded = false; onError(); };
  canvas.addEventListener('webglcontextlost', contextLost);
  Promise.all([
    loadTexture('/textures/earth/day.jpg', 0, 'dayMap'),
    loadTexture('/textures/earth/clouds.jpg', 1, 'cloudMap'),
  ]).then(() => { if (!disposed) { loaded = true; sync(); onReady(); } }).catch(() => { if (!disposed) onError(); });
  return {
    setPaused(value) { paused = value; sync(); },
    dispose() {
      disposed = true;
      endDrag();
      cancelAnimationFrame(frame);
      Object.entries(handlers).forEach(([type, handler]) => canvas.removeEventListener(type, handler));
      window.removeEventListener('blur', blur);
      observer.disconnect(); resize.disconnect();
      document.removeEventListener('visibilitychange', sync);
      canvas.removeEventListener('webglcontextlost', contextLost);
      images.forEach(image => { image.onload = null; image.onerror = null; });
      textures.forEach(texture => gl.deleteTexture(texture));
      shaders.forEach(shader => gl.deleteShader(shader));
      gl.deleteBuffer(buffer); gl.deleteProgram(program);
    },
  };
}
