// Window glass: dark, slightly see-through, unlit so night outside reads as a flat black-blue.
shader_type spatial;
render_mode blend_mix, cull_disabled, unshaded, depth_draw_opaque;

uniform vec4 tint : source_color = vec4(0.08, 0.12, 0.2, 0.55);
uniform vec2 snap_resolution = vec2(320.0, 240.0);

void vertex() {
	vec4 clip = PROJECTION_MATRIX * (MODELVIEW_MATRIX * vec4(VERTEX, 1.0));
	if (clip.w > 0.0) {
		vec2 half_res = snap_resolution * 0.5;
		clip.xy = round(clip.xy / clip.w * half_res) / half_res * clip.w;
	}
	POSITION = clip;
}

void fragment() {
	ALBEDO = tint.rgb;
	ALPHA = tint.a;
}
