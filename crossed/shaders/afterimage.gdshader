// Louis's afterimage: once the headlights die, a flat pale silhouette of him stays where he crouched, like the
// shape left on your eyes after staring at a bright light. One solid shape: no shading, no inner edges (a depth
// pre-pass keeps his limbs from showing through each other), only its outline breathing a little.
// `strength` (0..1) fades it (chapter1_director.gd drives it).
shader_type spatial;
render_mode unshaded, blend_mix, depth_prepass_alpha, cull_back, shadows_disabled, fog_disabled;

uniform float strength = 0.0;
uniform vec3 tint : source_color = vec3(0.6, 0.66, 0.66);

varying vec3 wpos;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
	vec2 i = floor(p), f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	float n = vnoise(wpos.xy * 3.0 + vec2(0.0, TIME * 0.4));
	float flick = 0.9 + 0.1 * sin(TIME * 19.0) * sin(TIME * 3.1);
	ALBEDO = tint;
	ALPHA = clamp(strength * flick * (0.85 + 0.15 * n), 0.0, 1.0);
}
