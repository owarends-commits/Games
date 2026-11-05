// A headlight's visible cone: the beam you see hanging in the rain and fog, from the lamp out to where it lands.
// Drawn on an open-ended cone mesh (narrow end at the lamp at local +cone_len/2, wide end at -cone_len/2); additive, brightest
// down the middle and near the lamp, soft at its edges, fading out toward the far end, with slow drifting murk.
shader_type spatial;
render_mode unshaded, blend_add, depth_draw_never, cull_disabled, shadows_disabled, fog_disabled;

uniform vec3 color : source_color = vec3(1.0, 0.93, 0.78);
uniform float strength = 0.22;
uniform float cone_len = 10.0;

varying vec3 lpos;
varying float along;

float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float vnoise(vec3 p) {
	vec3 i = floor(p), f = fract(p);
	vec3 u = f * f * (3.0 - 2.0 * f);
	float a = mix(mix(hash(i), hash(i + vec3(1, 0, 0)), u.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), u.x), u.y);
	float b = mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), u.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), u.x), u.y);
	return mix(a, b, u.z);
}

void vertex() {
	lpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	along = clamp((cone_len * 0.5 - VERTEX.y) / cone_len, 0.0, 1.0);
}

void fragment() {
	float edge = pow(clamp(abs(dot(normalize(NORMAL), normalize(VIEW))), 0.0, 1.0), 1.4);   // soft sides
	float fade = (1.0 - smoothstep(0.55, 1.0, along)) * (0.35 + 0.65 * (1.0 - along));
	float near_lamp = smoothstep(0.0, 0.04, along);
	float murk = 0.65 + 0.35 * vnoise(lpos * 0.9 + vec3(TIME * 0.25, TIME * 0.05, 0.0));
	ALBEDO = color * strength * edge * fade * near_lamp * murk;
}
