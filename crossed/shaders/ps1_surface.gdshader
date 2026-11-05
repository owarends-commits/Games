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

varying vec3 v_affine;      // uv * w, w
varying vec2 v_persp;

void vertex() {
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
