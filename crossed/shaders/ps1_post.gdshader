// Full-screen PS1 finish, run at the game's base resolution (320x240 unless a style raises it):
// colour depth (32 levels per channel = 15-bit), a 4x4 ordered dither, film grain, saturation, and the
// style controls (contrast, tint, vignette, scanlines). The defaults are the original look; the styles in
// scripts/systems/look_presets.gd set these.
shader_type canvas_item;

uniform sampler2D screen_tex : hint_screen_texture, filter_nearest;
uniform float color_levels = 32.0;
uniform float dither_strength = 1.0;
uniform float grain = 0.025;
uniform float grain_speed = 1.0;        // 1 = new noise every frame (the "static"); 0 = a still, paper-like texture
uniform float grain_size = 1.0;         // pixels per grain cell
uniform float saturation = 1.0;
uniform float contrast = 1.0;
uniform float brightness = 0.0;
uniform vec3 tint = vec3(1.0);
uniform float vignette = 0.0;           // 0..1: darkening toward the corners
uniform float scanlines = 0.0;          // 0..1: darkens every other line of the output (needs a raised base resolution to read as lines)
uniform float sharpen = 0.0;            // 0..1: a light unsharp mask, so faces and edges hold up

const float BAYER[16] = {
	0.0, 8.0, 2.0, 10.0,
	12.0, 4.0, 14.0, 6.0,
	3.0, 11.0, 1.0, 9.0,
	15.0, 7.0, 13.0, 5.0
};

void fragment() {
	vec3 c = texture(screen_tex, SCREEN_UV).rgb;
	if (sharpen > 0.0) {
		vec2 px = SCREEN_PIXEL_SIZE;
		vec3 blur = (texture(screen_tex, SCREEN_UV + vec2(px.x, 0.0)).rgb + texture(screen_tex, SCREEN_UV - vec2(px.x, 0.0)).rgb
			+ texture(screen_tex, SCREEN_UV + vec2(0.0, px.y)).rgb + texture(screen_tex, SCREEN_UV - vec2(0.0, px.y)).rgb) * 0.25;
		c = c + (c - blur) * sharpen;
	}
	c = (c - 0.5) * contrast + 0.5 + brightness;
	c *= tint;
	float l = dot(c, vec3(0.299, 0.587, 0.114));
	c = mix(vec3(l), c, saturation);
	if (vignette > 0.0) {
		vec2 q = SCREEN_UV - 0.5;
		c *= 1.0 - vignette * smoothstep(0.25, 0.75, length(q * vec2(1.15, 1.0)));
	}
	ivec2 p = ivec2(mod(FRAGCOORD.xy, 4.0));
	float d = (BAYER[p.y * 4 + p.x] / 16.0 - 0.5) * dither_strength;
	vec2 g = floor(FRAGCOORD.xy / max(grain_size, 1.0));
	float t = floor(TIME * 60.0 * grain_speed) / 60.0;
	float n = fract(sin(dot(g + vec2(t * 37.0, t * 11.0), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
	c += n * grain;
	if (scanlines > 0.0) {
		c *= 1.0 - scanlines * step(0.5, fract(FRAGCOORD.y * 0.5));
	}
	c = floor(c * (color_levels - 1.0) + d + 0.5) / (color_levels - 1.0);
	COLOR = vec4(clamp(c, 0.0, 1.0), 1.0);
}
