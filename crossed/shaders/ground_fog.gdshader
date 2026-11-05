// Ground fog: one of several stacked sheets near the ground (scripts/environments/ground_fog.gd makes them).
// Thick at the ankles, thinning to wisps by the hips; two layers of noise drift through it at different speeds.
// Lit (moon, headlights, the flashlight light it up), never written to depth.
// A top-down mask keeps it out of the houses; "holes" keep it out of the car and truck cabins.
shader_type spatial;
render_mode blend_mix, depth_draw_never, cull_disabled, diffuse_lambert, specular_disabled, shadows_disabled;

uniform vec4 fog_color : source_color = vec4(0.62, 0.66, 0.7, 1.0);
uniform float density = 0.34;            // the bottom sheet's opacity
uniform float falloff = 0.5;             // metres: opacity halves roughly every this much height
uniform sampler2D noise_tex : filter_linear, repeat_enable;
uniform sampler2D mask_tex : filter_linear, repeat_disable, hint_default_white;
uniform vec4 mask_rect = vec4(-90.0, -80.0, 220.0, 400.0);   // x0, z0, width, depth (metres)
uniform vec2 wind = vec2(0.22, 0.09);    // metres per second
uniform vec4 hole0 = vec4(0.0, 0.0, -1.0, 0.0);   // x, z, radius (<0 = off)
uniform vec4 hole1 = vec4(0.0, 0.0, -1.0, 0.0);
uniform float near_fade = 1.6;           // fades out right in front of the lens
uniform float far_build = 1.6;           // how much thicker it reads in the distance (swallows trunks and house footings)
uniform float glow = 0.05;               // a faint pale self-light so it reads against black woods

varying vec3 wpos;

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

float hole(vec4 h, vec2 p) {
	if (h.z <= 0.0) return 1.0;
	return smoothstep(h.z, h.z + 0.6, distance(p, h.xy));
}

void fragment() {
	float h = max(wpos.y, 0.0);
	float layer = exp(-h / falloff);
	vec2 p = wpos.xz;
	float t = TIME;
	float n1 = texture(noise_tex, p * 0.045 + wind * t * 0.045 + vec2(h * 3.1)).r;
	float n2 = texture(noise_tex, p * 0.13 - wind.yx * t * 0.11 + vec2(0.37, h * 1.7)).r;
	float n = smoothstep(0.3, 0.8, n1 * 0.7 + n2 * 0.45);       // billows and clear pockets
	float lump = smoothstep(0.25, 0.75, n1);                    // big slow banks of it
	vec2 muv = (p - mask_rect.xy) / mask_rect.zw;
	float m = texture(mask_tex, muv).r;
	float holes = hole(hole0, p) * hole(hole1, p);
	float d = length(VERTEX);                // view space: distance from the camera
	float near = smoothstep(0.35, near_fade, d);
	float far = 1.0 + far_build * smoothstep(3.0, 30.0, d);
	ALBEDO = fog_color.rgb * (0.8 + 0.3 * n2);
	EMISSION = fog_color.rgb * glow * (0.6 + 0.6 * n);
	float wisp = mix(1.0, n * n * 1.6, smoothstep(0.5, 1.3, h));   // up high only the thick billows survive
	ALPHA = clamp(density * layer * (0.2 + 1.1 * n) * (0.55 + 0.7 * lump) * wisp * far * m * holes * near, 0.0, 0.94);
	NORMAL = normalize((VIEW_MATRIX * vec4(0.0, 1.0, 0.0, 0.0)).xyz);      // lit like the ground it lies on
}
