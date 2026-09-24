// GLSL for the film cards and the post pass. Behaviour matches the reference shaders
// (docs/reference-spec.md §WebGL); formatted and commented here.

const imageUv = /* glsl */ `
vec2 imageuv(vec2 uv, vec2 size, vec2 resolution) {
  vec2 ratio = vec2(
    min((resolution.x / resolution.y) / (size.x / size.y), 1.0),
    min((resolution.y / resolution.x) / (size.y / size.x), 1.0)
  );
  return vec2(uv.x * ratio.x + (1.0 - ratio.x) * 0.5, uv.y * ratio.y + (1.0 - ratio.y) * 0.5);
}`;

const blur13 = /* glsl */ `
vec4 blur13(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.411764705882353) * direction;
  vec2 off2 = vec2(3.2941176470588234) * direction;
  vec2 off3 = vec2(5.176470588235294) * direction;
  color += texture2D(image, uv) * 0.1964825501511404;
  color += texture2D(image, uv + (off1 / resolution)) * 0.2969069646728344;
  color += texture2D(image, uv - (off1 / resolution)) * 0.2969069646728344;
  color += texture2D(image, uv + (off2 / resolution)) * 0.09447039785044732;
  color += texture2D(image, uv - (off2 / resolution)) * 0.09447039785044732;
  color += texture2D(image, uv + (off3 / resolution)) * 0.010381362401148057;
  color += texture2D(image, uv - (off3 / resolution)) * 0.010381362401148057;
  return color;
}`;

const vertexHead = /* glsl */ `precision highp float;
${imageUv}
#define MPI 3.1415926538
#define MTAU 6.28318530718
uniform vec2 u_diff_aspect;
uniform vec2 u_resolution;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform float u_time;
varying vec3 v_normal;
varying vec2 v_uv;
varying vec2 v_uv_base;
`;

// ---- Home: the vertical roll of film cards --------------------------------------------------
export const rollVertex = /* glsl */ `${vertexHead}
uniform vec2 u_scale;
uniform float u_a_effect;
uniform float u_a_parallax;
void main() {
  vec3 pos = position;
  pos.xy *= u_scale;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  v_normal = normalize(normalMatrix * normal);
  v_uv_base = uv;
  vec2 map_uv = imageuv(uv, u_diff_aspect, u_resolution);
  map_uv -= .5;
  map_uv.y -= u_a_parallax * 0.3;
  map_uv += .5;
  v_uv = map_uv;
}`;

export const rollFragment = /* glsl */ `precision highp float;
varying vec3 v_normal;
varying vec2 v_uv;
varying vec2 v_uv_base;
uniform float u_time;
uniform sampler2D u_diff;
uniform sampler2D u_mask;
uniform float u_a_effect;
uniform float u_a_page_alpha;
float blendColorDodge(float base, float blend) { return (blend == 1.0) ? blend : min(base / (1.0 - blend), 1.0); }
vec3 blendColorDodge(vec3 base, vec3 blend) {
  return vec3(blendColorDodge(base.r, blend.r), blendColorDodge(base.g, blend.g), blendColorDodge(base.b, blend.b));
}
void main() {
  // the left 71.68% of the mask atlas is the rounded "film frame" shape for the roll cards
  vec2 calc_uv = vec2(v_uv_base.x * 0.7167957095, v_uv_base.y);
  float mask = texture2D(u_mask, calc_uv).r;
  vec3 color = texture2D(u_diff, v_uv).rgb;
  // warm, darkened corners (colour-dodge toward amber), fading to the true image in the middle
  vec2 stp = vec2(.1, .4);
  float grads = smoothstep(stp.x, stp.y, distance(v_uv, vec2(0.15))) * smoothstep(stp.x, stp.y, distance(v_uv, vec2(0.85)));
  color = mix(mix(color * .2, blendColorDodge(color, vec3(1., .86, .0)) * .3, .2), color, grads);
  color *= smoothstep(.5, .1, distance(v_uv.y, .5));
  gl_FragColor.rgb = color;
  gl_FragColor.a = mask * u_a_page_alpha;
}`;

// ---- Work: the horizontal slider of film cards -----------------------------------------------
export const sliderVertex = /* glsl */ `${vertexHead}
uniform float u_y;
uniform float u_x;
uniform vec2 u_scale;
uniform float u_a_effect;
uniform float u_a_parallax;
uniform float u_a_footage;
uniform float u_a_footage_focus;
uniform vec4 u_a_footage_img;
uniform float u_a_speed;
varying float v_x;
void main() {
  vec3 pos = position;
  vec3 final_pos = pos;
  pos.xy *= u_scale;
  // cards spread apart with speed, and fly off sideways when another film's footage opens
  pos.x += u_x * (1. + u_a_speed) * (1. + u_a_footage * 3.5);
  pos.y += u_y;
  // the focused card morphs into the footage frame rectangle
  final_pos.xy *= mix(vec2(1.), u_a_footage_img.zw, u_a_footage_focus);
  final_pos.xy = mix(pos.xy, final_pos.xy + u_a_footage_img.xy, u_a_footage_focus);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(final_pos, 1.0);
  v_normal = normalize(normalMatrix * normal);
  v_uv_base = uv;
  vec2 map_uv = imageuv(uv, u_diff_aspect, u_resolution);
  map_uv -= .5;
  map_uv *= .8;
  map_uv += .5;
  v_uv = map_uv;
  v_x = pos.x;
}`;

export const sliderFragment = /* glsl */ `precision highp float;
varying vec3 v_normal;
varying vec2 v_uv;
varying vec2 v_uv_base;
varying float v_x;
uniform float u_time;
uniform sampler2D u_diff;
uniform sampler2D u_mask;
uniform vec2 u_resolution;
uniform float u_a_page_alpha;
uniform float u_a_footage_focus;
uniform float u_a_footage;
${blur13}
void main() {
  // the right 28.32% of the mask atlas is the wide slider frame
  vec2 calc_uv = vec2(v_uv_base.x * 0.2832042905 + 0.7167957095, v_uv_base.y);
  float mask = texture2D(u_mask, calc_uv).r;
  vec3 color = texture2D(u_diff, v_uv).rgb;
  float blur_amount = 5.;
  vec3 blur_ho = blur13(u_diff, v_uv, vec2(1090., 1080.), vec2(blur_amount, 0.)).rgb;
  vec3 blur_ve = blur13(u_diff, v_uv, vec2(1090., 1080.), vec2(0., blur_amount)).rgb;
  vec3 blur_img = mix(blur_ho, blur_ve, 0.5);
  // sharp in the centre, blurred and darker toward the sides
  float center_d = smoothstep(1.5, .0, abs(v_x));
  float center_d_less = smoothstep(5., 0., abs(v_x));
  color = mix(blur_img * center_d_less, color, center_d);
  color *= smoothstep(0.15, .5, v_uv.y);
  gl_FragColor.rgb = color;
  gl_FragColor.a = mask * (1. - u_a_footage) * u_a_page_alpha;
}`;

// ---- Work: footage lightbox strips (two rows scrolling in opposite directions) ---------------
export const stripVertex = /* glsl */ `${vertexHead}
uniform float u_index;
uniform float u_x;
uniform vec2 u_scale;
uniform float u_a_parallax;
uniform float u_a_in;
uniform float u_a_speed;
uniform float u_TOTAL;
const float SPACING = .05;
const float SPEED_MULT = 4.;
varying float v_x;
varying float v_pos_x;
void main() {
  vec3 pos = position;
  vec2 scale = u_scale;
  pos.xy *= scale;
  float direction = mod(u_index, 2.);
  pos.y += direction * (scale.y + SPACING) - .5 * scale.y;
  float x = (mod(u_index + u_x * (direction - .5) * SPEED_MULT, u_TOTAL) - u_TOTAL / 2.) * (scale.x + SPACING) / 2.;
  v_x = clamp(smoothstep(0., 7., abs(x)), 0., 1.);
  pos.x += x * (1. + u_a_speed);
  pos.x += (direction - .5) * (1. - u_a_in) * 20.;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  v_normal = normalize(normalMatrix * normal);
  v_uv_base = uv;
  vec2 map_uv = imageuv(uv, u_diff_aspect, u_resolution);
  map_uv -= .5;
  map_uv *= .8;
  map_uv.y -= u_a_parallax * .2;
  map_uv += .5;
  v_uv = map_uv;
  v_pos_x = pos.x;
}`;

export const stripFragment = /* glsl */ `precision highp float;
varying vec3 v_normal;
varying vec2 v_uv;
varying vec2 v_uv_base;
varying float v_x;
varying float v_pos_x;
uniform float u_time;
uniform sampler2D u_diff;
uniform sampler2D u_mask;
uniform float u_a_in;
${blur13}
void main() {
  vec2 calc_uv = vec2(v_uv_base.x * 0.2832042905 + 0.7167957095, v_uv_base.y);
  float mask = texture2D(u_mask, calc_uv).r;
  vec3 img = blur13(u_diff, v_uv, vec2(.5), vec2(v_x * .03)).rgb;
  float blur_fac = 10.;
  vec3 blur_h = blur13(u_diff, v_uv, vec2(1920., 1080.), vec2(blur_fac, 0.)).rgb;
  vec3 blur_v = blur13(u_diff, v_uv, vec2(1920., 1080.), vec2(0., blur_fac)).rgb;
  img = mix(img, mix(blur_h, blur_v, .5), v_x);
  float from_center = smoothstep(2.5, 0., distance(0., v_pos_x));
  img *= smoothstep(.6, .0, distance(v_uv, vec2(.5)));
  gl_FragColor.rgb = img;
  gl_FragColor.a = mask * from_center;
}`;

// ---- Post: film bulge, directional motion blur with speed, grain ------------------------------
export const postVertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 v_uv;
void main() { gl_Position = vec4(position, 0, 1); v_uv = uv; }`;

export const postFragment = /* glsl */ `precision highp float;
uniform float u_time;
uniform sampler2D u_texture;
varying vec2 v_uv;
const vec2 CENTER = vec2(0.5, 0.5);
uniform float u_BULGE_RADIUS;
uniform float u_BULGE_STRENGTH;
uniform float u_NOISE_AMOUNT;
uniform float u_FILM_POWER;
uniform vec2 u_a_blur_direction;
uniform float u_a_blur_power;
uniform float u_a_speed;
${blur13}
void main() {
  vec2 dir = v_uv - CENTER;
  float bulge = pow(1.0 - smoothstep(0.0, u_BULGE_RADIUS, length(dir)), 2.0);
  vec2 distortedUV = v_uv - dir * bulge * u_BULGE_STRENGTH;
  // on the work page (horizontal blur) the bottom 15% is kept sharp
  float bottom_corner = mix(step(.15, distance(0., v_uv.y)), 1., u_a_blur_direction.y);
  vec4 img = texture2D(u_texture, distortedUV);
  vec4 img_blur = blur13(u_texture, distortedUV, vec2(1920., 1080.), u_a_blur_direction * 10.);
  img = mix(img, img_blur, u_a_speed * .5 * bottom_corner);
  img += img_blur * u_a_speed * u_a_blur_power * u_FILM_POWER * bottom_corner;
  float noise = fract(sin(dot(vec2(sin(v_uv.x + u_time) + 1., v_uv.y), vec2(12.9898, 78.233) * 2.0)) * 43758.5453);
  img += noise * u_NOISE_AMOUNT;
  gl_FragColor.rgb = img.rgb;
  gl_FragColor.a = 1.0;
}`;
