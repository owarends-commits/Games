// The Brute's arm: the PS1 surface (below) plus flesh that moves under the skin. Lumps swell and travel along
// the arm, slow and uneven, with a deeper heave now and then, as if something is shifting around inside it.
// PS1-style opaque surface.
// - Vertices snap to the 320x240 pixel grid (the classic wobble).
// - Affine texture mapping (textures warp across large polygons), blendable with `affine_amount`.
// - Nearest-neighbour sampling of small textures.
// - Optional world-space UVs so a texture tiles at a fixed size on any box (good for blockout CSG).
shader_type spatial;
render_mode cull_back, diffuse_lambert, specular_disabled;

uniform vec4 albedo : source_color = vec4(1.0);
uniform sampler2D albedo_tex : source_color, filter_nearest, repeat_enable, hint_default_white;
uniform bool world_uv = true;
uniform vec2 uv_scale = vec2(1.0, 1.0);        // texture repeats per metre (world_uv) or per UV unit
uniform vec2 uv_offset = vec2(0.0);
uniform float affine_amount : hint_range(0.0, 1.0) = 0.6;
uniform vec2 snap_resolution = vec2(320.0, 240.0);
uniform float emission_strength = 0.0;
uniform vec4 emission_color : source_color = vec4(1.0);

uniform float crawl_amount = 0.022;   // metres (before the model's scale)
uniform float crawl_speed = 0.7;

float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n3(vec3 p) {
	vec3 i = floor(p), f = fract(p);
	vec3 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), u.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), u.x), u.y),
	           mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), u.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), u.x), u.y), u.z);
}

varying vec3 v_affine;      // uv * w, w
varying vec2 v_persp;

void vertex() {
	float t = TIME * crawl_speed;
	float lumps = n3(VERTEX * 11.0 + vec3(0.0, -t * 1.3, t * 0.6)) * 0.7 + n3(VERTEX * 23.0 + vec3(t, t * 0.4, 0.0)) * 0.3;
	float heave = 0.5 + 0.5 * sin(TIME * 1.3 + VERTEX.y * 9.0) * sin(TIME * 0.37);
	VERTEX += NORMAL * crawl_amount * (smoothstep(0.35, 0.85, lumps) * (0.6 + 0.8 * heave) - 0.2);
	vec2 uv = UV;
	if (world_uv) {
		vec3 wp = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
		vec3 wn = abs(normalize((MODEL_MATRIX * vec4(NORMAL, 0.0)).xyz));
		if (wn.y >= wn.x && wn.y >= wn.z) {
			uv = wp.xz;
		} else if (wn.x >= wn.z) {
			uv = vec2(wp.z, -wp.y);
		} else {
			uv = vec2(wp.x, -wp.y);
		}
	}
	uv = uv * uv_scale + uv_offset;
	vec4 clip = PROJECTION_MATRIX * (MODELVIEW_MATRIX * vec4(VERTEX, 1.0));
	if (clip.w > 0.0) {
		vec2 half_res = snap_resolution * 0.5;
		clip.xy = round(clip.xy / clip.w * half_res) / half_res * clip.w;
	}
	POSITION = clip;
	v_affine = vec3(uv * clip.w, clip.w);
	v_persp = uv;
}

void fragment() {
	vec2 uv = mix(v_persp, v_affine.xy / v_affine.z, affine_amount);
	vec4 tex = texture(albedo_tex, uv);
	ALBEDO = tex.rgb * albedo.rgb;
	EMISSION = emission_color.rgb * emission_strength * tex.rgb;
}
