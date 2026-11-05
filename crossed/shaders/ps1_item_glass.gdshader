// See-through item parts (the flashlight lens, the pill bottle): ps1_item, blended.
shader_type spatial;
render_mode blend_mix, depth_draw_never, cull_disabled, diffuse_lambert, specular_schlick_ggx;

uniform vec4 albedo : source_color = vec4(1.0);
uniform sampler2D albedo_tex : source_color, filter_nearest, repeat_enable, hint_default_white;
uniform vec2 uv_scale = vec2(1.0);
uniform float spec = 0.6;
uniform float rough = 0.2;
uniform float glow = 0.0;
uniform float alpha = 0.55;
uniform float affine_amount : hint_range(0.0, 1.0) = 0.3;
uniform vec2 snap_resolution = vec2(240.0, 180.0);

varying vec3 v_affine;
varying vec2 v_persp;

void vertex() {
	vec2 uv = UV * uv_scale;
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
	ALPHA = alpha;
	SPECULAR = spec;
	ROUGHNESS = rough;
	EMISSION = ALBEDO * glow;
}
