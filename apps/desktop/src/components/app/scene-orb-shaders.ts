// Geometry supplies the complete sphere; no background image or texture pass.
export const connectionsVertex = /* glsl */ `
  attribute vec3 aStart;
  attribute vec3 aEnd;
  attribute float aStrength;
  attribute float aOpacity;
  uniform float uTime;
  uniform float uMotion;
  uniform vec2 uViewport;
  uniform float uScale;
  varying float vSide;
  varying float vStrength;
  varying float vOpacity;
  varying vec3 vIllumination;
  varying float vAlong;
  float illuminate(vec3 point) {
    float phase = point.x * 3.6 + point.y * 1.8
      + sin(point.y * 5.0 - uTime * 0.29) * 0.65 + uTime * 0.86;
    float wave = 0.5 + 0.5 * sin(phase);
    float squared = wave * wave;
    return mix(1.0, 1.05 + squared * squared * wave * 0.6, uMotion);
  }
  void main() {
    vec4 start = projectionMatrix * modelViewMatrix * vec4(aStart, 1.0);
    vec4 end = projectionMatrix * modelViewMatrix * vec4(aEnd, 1.0);
    vec2 direction = (end.xy / end.w - start.xy / start.w) * uViewport;
    float extent = max(length(direction), 0.0001);
    vec2 normal = vec2(-direction.y, direction.x) / extent;
    vec4 clip = mix(start, end, position.y);
    // Only the endpoints move. Both long sides remain affine straight lines.
    clip.xy += normal * position.x * 3.0 * uScale * 2.0 / uViewport * clip.w;
    gl_Position = clip;
    vSide = position.x * 3.0;
    // Lighting is smooth along a filament. Three samples preserve its moving
    // highlight while removing trigonometry from millions of glow fragments.
    float lightStart = illuminate(aStart);
    float lightEnd = illuminate(aEnd);
    float lightMiddle = illuminate((aStart + aEnd) * 0.5);
    vIllumination = vec3(lightStart, lightEnd,
      4.0 * (lightMiddle - (lightStart + lightEnd) * 0.5));
    vAlong = position.y;
    vStrength = aStrength;
    vOpacity = aOpacity;
  }
`;

export const connectionsFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vSide;
  varying float vStrength;
  varying float vOpacity;
  varying vec3 vIllumination;
  varying float vAlong;
  void main() {
    float illumination = mix(vIllumination.x, vIllumination.y, vAlong)
      + vIllumination.z * vAlong * (1.0 - vAlong);
    float core = exp(-vSide * vSide / 0.29);
    float halo = exp(-vSide * vSide / 2.5) * 0.065;
    float alpha = (core + halo) * vStrength * vOpacity * illumination * 0.34;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.9), alpha);
  }
`;

export const nodesVertex = /* glsl */ `
  attribute float aStrength;
  attribute float aSeed;
  attribute float aOpacity;
  attribute float aReleased;
  attribute float aNodeIndex;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform float uTrackedNode;
  varying float vStrength;
  varying float vOpacity;
  varying float vPulse;
  varying float vTracked;
  varying float vReleased;
  void main() {
    vStrength = aStrength;
    vReleased = aReleased;
    vOpacity = aOpacity;
    vTracked = 1.0 - step(0.5, abs(aNodeIndex - uTrackedNode));
    float local = pow(0.5 + 0.5 * sin(uTime * (0.7 + aSeed * 0.45)
      + aSeed * 83.0), 10.0);
    float traveling = pow(0.5 + 0.5 * sin(position.x * 3.6
      + position.y * 1.8 + uTime * 0.86), 12.0);
    vPulse = local * 0.65 + traveling * 0.35;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = mix(13.0 + vPulse * 5.0, 26.0, vTracked)
      * uPixelRatio * uScale;
  }
`;

export const nodesFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uMotion;
  varying float vStrength;
  varying float vOpacity;
  varying float vPulse;
  varying float vTracked;
  varying float vReleased;
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(p, p);
    if (r2 > 1.0) discard;
    float core = exp(-r2 * 110.0);
    float halo = exp(-r2 * 7.5) * (1.0 - smoothstep(0.55, 1.0, r2));
    float energy = pow(vStrength, 1.5) * (0.42 + uMotion * (vPulse * 0.6 + vReleased * 0.32)) * vOpacity;
    float alpha = (core + halo * 0.085) * energy;
    float ring = exp(-pow((sqrt(r2) - 0.72) * 24.0, 2.0));
    alpha += ring * vTracked * vOpacity * 0.8;
    vec3 tint = mix(mix(uColor, vec3(1.0), 0.72), vec3(1.0), core);
    tint = mix(tint, vec3(1.0, 0.78, 0.36), vTracked * ring);
    gl_FragColor = vec4(tint, alpha);
  }
`;
