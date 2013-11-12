;/**
 * @file ColorAdjust.js
 * 
 * Contains a Class for converting RGB values into HSL and vice versa,
 * but also for calculate color differences and others.
 * 
 * @author Lukas Zurschmiede <lukas@ranta.ch>
 * @copyright 2013 by Lukas Zurschmiede
 * @license GPL-v3 or later
 */

/**
 * Class for calculate some differences between RGB and HSL.
 * 
 * For information about HSL see:
 * http://www.had2know.com/technology/hsl-rgb-color-converter.html
 */
function ColorAdjust() {}

ColorAdjust.prototype = {
	
	/**
	 * Get the difference between two colors.
	 * 
	 * @param string color1
	 *   First color as HEX string.
	 * @param string color2
	 *   Second color as HEX string.
	 * @return object
	 *   A color value object which holds the difference.
	 */
	difference: function(color1, color2) {
		var c1 = this.fromHEX(color1);
		var c2 = this.fromHEX(color2);
		return this._calcDifference(c1, c2);
	},
	
	/**
	 * Get the difference between two colors as a SASS string.
	 * 
	 * @param string color1
	 *   First color as HEX string.
	 * @param string color2
	 *   Second color as HEX string.
	 * @return string
	 *   A string which can be used in SASS to calculate the second color.
	 */
	sassDifference: function(color1, color2) {
		var c1 = this.fromHEX(color1);
		var c2 = this.fromHEX(color2);
		var diff = this._calcDifference(c1, c2);
		var result = c1.hex;
		
		// Lighten or darken.
		if (diff.l > 0) {
			result = 'lighten(' + result + ', ' + this._formatFloat(Math.abs(diff.l * 100)) + ')'
		} else if (diff.l < 0) {
			result = 'darken(' + result + ', ' + this._formatFloat(Math.abs(diff.l * 100)) + ')'
		}
		
		// Saturate or desaturate.
		if (diff.s > 0) {
			result = 'saturate(' + result + ', ' + this._formatFloat(Math.abs(diff.s * 100)) + ')'
		} else if (diff.s < 0) {
			result = 'desaturate(' + result + ', ' + this._formatFloat(Math.abs(diff.s * 100)) + ')'
		}
		
		// Adjust hue.
		if (diff.h != 0) {
			result = 'adjust_hue(' + result + ', ' + this._formatFloat(c1.h + diff.h) + ')'
		}
		
		return result;
	},
	
	/**
	 * Adjust a color, defined as HEX, with the given HSL values.
	 * 
	 * @param string color
	 *   The color to adjust - a HEX string.
	 * @param float h
	 *   Hue-Adjustment, a positive or negative value which interprets a degree (0-360).
	 * @param float s
	 *   Saturation-Adjustment, a positive or negative value (0-100).
	 * @param float l
	 *   Ligh-Adjustment, a positive or negative value (0-100).
	 * @return object
	 *   A color value object with the adjusted color.
	 */
	adjustHSL: function(color, h, s, l) {
		h = parseFloat(h);
		s = parseFloat(s);
		l = parseFloat(l);
		
		var col = this.fromHEX(color);
		var hsl = this._getColorValueObject();
		
		hsl.h = Math.abs((col.h + h) % 360);
		hsl.s = Math.min(col.s + s/100, 1);
		hsl.l = Math.min(col.l + l/100, 1);
		hsl.s = hsl.s < 0 ? 0 : hsl.s;
		hsl.l = hsl.l < 0 ? 0 : hsl.l;
		
		return this.fromHSL(hsl.h, hsl.s, hsl.l);
	},
	
	/**
	 * Returns a color value object from the given HEX color.
	 * 
	 * @param string hex
	 *   A color define in HEX: #RRGGBB
	 * @return object
	 *   Color values object {r, g, b, h, s, l, hex}
	 */
	fromHEX: function(hex) {
		var rgb = this._splitHex(hex);
		return this.fromRGB(rgb.r, rgb.g, rgb.b);
	},
	
	/**
	 * Returns a color value object from the given RGB values.
	 * 
	 * @param int r
	 *   Red color value.
	 * @param int g
	 *   Green color value.
	 * @param int b
	 *   Blue color value.
	 * @return object
	 *   Color values object {r, g, b, h, s, l, hex}
	 */
	fromRGB: function(r, g, b) {
		r = parseInt(r);
		g = parseInt(g);
		b = parseInt(b);
		
		var h, s, l;
		var result = this._getColorValueObject();
		
		result.r = r;
		result.g = g;
		result.b = b;
		
		r = r / 255;
		g = g / 255;
		b = b / 255;
		
		var max = Math.max(r, Math.max(g, b));
		var min = Math.min(r, Math.min(g, b));
		var diff = max - min;
		
		l = (max + min) / 2;
		s = (diff == 0) ? 0 : diff / (1 - Math.abs(max + min - 1));
		if (max == min) {
			h = 0;
		}
		else if (max == r) {
			h = 60 * (0 + ((g - b) / diff));
		}
		else if (max == g) {
			h = 60 * (2 + ((b - r) / diff));
		}
		else if (max == b) {
			h = 60 * (4 + ((r - g) / diff));
		}
		
		// Maximum 4 decimals
		result.h = this._formatFloat(h);
		result.s = this._formatFloat(s);
		result.l = this._formatFloat(l);
		
		result.hex = this._toHEXColor(result.r, result.g, result.b);
		return result;
	},
	
	/**
	 * Returns a color value object from the given HSL values.
	 * 
	 * @param int h
	 *   Hue color value.
	 * @param int s
	 *   Saturation color value.
	 * @param int l
	 *   Lightness color value.
	 * @return object
	 *   Color values object {r, g, b, h, s, l, hex}
	 */
	fromHSL: function(h, s, l) {
		h = parseFloat(h);
		s = parseFloat(s);
		l = parseFloat(l);
		
		var chroma, hue, x, light, r, g, b;
		var result = this._getColorValueObject();
		
		if (h > 1) { h = h / 100; }
		if (s > 1) { s = s / 100; }
		if (l > 1) { l = l / 100; }
		
		result.h = h;
		result.s = s;
		result.l = l;
		
		chroma = (1 - Math.abs((2 * l) - 1)) * s;
		hue = h / 60;
		x = chroma * (1 - Math.abs(hue%2 - 1));
		light = l - (chroma / 2);
		
		if (h == 0) {
			r = 0;
			g = 0;
			b = 0;
		}
		else if (hue >= 0 && hue < 1) {
			r = chroma;
			g = x;
			b = 0;
		}
		else if (hue >= 1 && hue < 2) {
			r = x;
			g = chroma;
			b = 0;
		}
		else if (hue >= 2 && hue < 3) {
			r = 0;
			g = chroma;
			b = x;
		}
		else if (hue >= 3 && hue < 4) {
			r = 0;
			g = x;
			b = chroma;
		}
		else if (hue >= 4 && hue < 5) {
			r = x;
			g = 0;
			b = chroma;
		}
		else if (hue >= 5 && hue < 6) {
			r = chroma;
			g = 0;
			b = x;
		}
		
		result.r = Math.round((r + light) * 255);
		result.g = Math.round((g + light) * 255);
		result.b = Math.round((b + light) * 255);
		
		result.hex = this._toHEXColor(result.r, result.g, result.b);
		return result;
	},
	
	/**
	 * Calculates the difference between two color value objects.
	 * 
	 * @param object c1
	 *   First color defined in a color value object.
	 * @param object c2
	 *   Second color defined in a color value object.
	 * @return object
	 *   A color value object whic holds the differences.
	 */
	_calcDifference: function(c1, c2) {
		var result = this._getColorValueObject();
		
		result.r = this._formatFloat(c2.r - c1.r);
		result.g = this._formatFloat(c2.g - c1.g);
		result.b = this._formatFloat(c2.b - c1.b);
		result.h = this._formatFloat(c2.h - c1.h);
		result.s = this._formatFloat(c2.s - c1.s);
		result.l = this._formatFloat(c2.l - c1.l);
		
		// No hex value.
		result.hex = '';
		return result;
	},
	
	/**
	 * Split up a HEX Color value into it's RGB int values.
	 * 
	 * @param string str
	 *   Color in HEX, even as 6 or 3 char, with or without a leading #.
	 * @return object
	 *   RGB values in an object {r, g, b}
	 */
	_splitHex: function(str) {
		if (str.substr(0, 1) == '#') {
			str = str.substr(1, 6);
		}
		if (str.length == 3) {
			return {
				r: this._fromHex(str.substr(0, 1) + str.substr(0, 1)),
				g: this._fromHex(str.substr(2, 1) + str.substr(2, 1)),
				b: this._fromHex(str.substr(4, 1) + str.substr(4, 1))
			};
		}
		return {
			r: this._fromHex(str.substr(0, 2)),
			g: this._fromHex(str.substr(2, 2)),
			b: this._fromHex(str.substr(4, 2))
		};
	},
	
	/**
	 * Returns the int value from a hex string
	 * 
	 * @param string str
	 *   The HEX value to be converted into an integer.
	 * @return int
	 */
	_fromHex: function(str) {
		return parseInt(str, 16);
	},
	
	/**
	 * Returns the HEX value defined by the given integer.
	 * 
	 * @param int num
	 *   The Integer to be converted to hex.
	 * @return string
	 */
	_toHex: function(num) {
		num = parseInt(num);
		var s = num.toString(16);
		return (s.length == 1) ? '0' + s : s;
	},
	
	/**
	 * Returns a simple HEX coded color value.
	 * 
	 * @param int r
	 *   Red color value.
	 * @param int g
	 *   Green color value.
	 * @param int b
	 *   Blue color value.
	 * @return string
	 *   Color as HEX string prefixed with a #.
	 */
	_toHEXColor: function(r, g, b) {
		var hex = '#' + this._toHex(r) + this._toHex(g) + this._toHex(b);
		return hex.toUpperCase();
	},
	
	/**
	 * Formats a float and returns it with the requested amount of decimals.
	 * 
	 * @param float v
	 *   The value to round and strip decimals.
	 * @param int d
	 *   (optional) The amount of decimals the formatted float should have.
	 * @return float
	 *   The float v with maximum amount of d decimals.
	 */
	_formatFloat: function(v, d) {
		if (typeof(d) == 'undefined') {
			d = 4;
		}
		d = Math.pow(10, d + 1);
		return Math.round(v * d) / d;
	},
	
	/**
	 * Returns a simple color value object with initial values set to 0.
	 * 
	 * @return object
	 *   Color value object {r, g, b, h, s, l, hex}
	 */
	_getColorValueObject: function() {
		return { r: 0, g: 0, b: 0, h: 0, s: 0, l: 0, hex: '#000000' };
	},
	
	
	
	/**
	 * Dummy to prevent syntax/parsing errors in case of last ',' after a function.
	 */
	__last__: 0
};
