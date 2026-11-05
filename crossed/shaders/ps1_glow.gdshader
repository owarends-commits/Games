shader_type spatial;
// Full-bright surfaces that ignore lighting (ACROSS eyes). Same vertex snap as ps1_surface.
render_mode unshaded, cull_back;
uniform vec4 color : source_color = vec4(1.0);
uniform vec2 snap_resolution = vec2(320.0, 240.0);

void vertex() {
	vec4 clip = PROJECTION_MATRIX * (MODELVIEW_MATRIX * vec4(VERTEX, 1.0));
	if (clip.w > 0.0) {
		vec2 ndc = clip.xy / clip.w;
		ndc = floor(ndc * snap_resolution * 0.5 + 0.5) / (snap_resolution * 0.5);
		clip.xy = ndc * clip.w;
	}
	POSITION = clip;
}

void fragment() {
	ALBEDO = color.rgb;
}
