;/**
 * @file Slider.js
 * 
 * Contains a Class for a simple slider.
 * Set the minimum and maximum, get the current value and call
 * a handler while start-, end- and move.
 * 
 * @author Lukas Zurschmiede <lukas@ranta.ch>
 * @copyright 2013 by Lukas Zurschmiede
 * @license GPL-v3 or later
 */

/**
 * Class for a simple slider.
 * 
 * The slider will be build as follow in markup, whereas
 * the 'slider_name_container' must be existent and given to
 * the build function.
 * <code>
 * 	<div class="slider_container" id="slider_name_container">
 * 		<div class="slider" id="slider_name">
 * 			<a href="#" class="slider">&bull;</a>
 * 		</div>
 * 		<label for="slider_name">Label for this slider</label>
 * 	</div>
 * </code>
 * 
 * @param DOMNode container
 *   The container where the slider should be placed in.
 * @param string label
 *   Text to use for the label.
 * @param string id
 *   The id/name value for the slider.
 * @param string classes
 *   A list of CSS Classes to attach to the slider.
 */
function Slider(container, label, id, classes) {
	this._move = [];
	this._start = [];
	this._end = [];
	this.slider = null;
	this.move = false;
	
	if (typeof(container.innerHTML) != 'undefined') {
		this.id = id;
		this.container = container;
		this.build(label, classes);
	} else {
		if (typeof(console.error) != 'undefined') {
			console.error('SLIDER: The first argument must be a valid DOM elemnt where we can place the slider in.');
			console.info(arguments);
		}
	}
}

Slider.prototype = {
	
	/**
	 * Create the slider.
	 * 
	 * @param string text
	 *   Text to use for the label.
	 * @param string classes
	 *   A list of CSS Classes to attach to the slider.
	 */
	build: function(text, classes) {
		var slider = document.createElement('div');
		slider.setAttribute('id', this.id);
		slider.className = classes;
		slider.style.position = 'relative';
		
		var label = document.createElement('label');
		label.setAttribute('for', this.id);
		label.innerHTML = text;
		
		this.slider = document.createElement('a');
		this.slider.setAttribute('href', '#');
		this.slider.className = classes;
		this.slider.innerHTML = '&bull;';
		
		slider.appendChild(this.slider);
		this.container.appendChild(slider);
		this.container.appendChild(label);
		
		this._connect();
	},
	
	/**
	 * Register an event which fired when the slider moves.
	 * 
	 * @param function fnc
	 *   Function to call when the slider moves.
	 *   As an argument the slider itselves is given.
	 */
	onmove: function(fnc) {
		this._move.push(fnc);
	},
	
	/**
	 * Register an event which fired when the slider starts moving.
	 * 
	 * @param function fnc
	 *   Function to call when the slider starts moving.
	 *   As an argument the slider itselves is given.
	 */
	onmovestart: function(fnc) {
		this._start.push(fnc);
	},
	
	/**
	 * Register an event which fired when the slider stops moving.
	 * 
	 * @param function fnc
	 *   Function to call when the slider stop moving.
	 *   As an argument the slider itselves is given.
	 */
	onmoveend: function(fnc) {
		this._end.push(fnc);
	},
	
	/**
	 * Returns a value between 0 and 1 which interprets the current value.
	 * 
	 * @return float
	 */
	value : function() {
		var max = this.container.clientWidth - (this.slider.clientWidth / 2);
		var pos = parseFloat(this.slider.style.left) + (this.slider.clientWidth / 2);
		return pos / max;
	},
	
	/**
	 * Place the slider at the given value between 0 and 1.
	 * 
	 * @param float value
	 *   The percentual position to place the slider at.
	 */
	position: function(value) {
		var max = this.container.clientWidth - (this.slider.clientWidth / 2);
		var pos = (value * max) - (this.slider.clientWidth / 2);
		this.slider.style.left = pos + 'px';
	},
	
	/**
	 * Connect the slider to all needed handlers.
	 */
	_connect: function() {
		var t = this;
		this._attach(document.body, 'mouseup', function(ev) {
			if (t.move) {
				for (f in t._end) {
					t._end[f](t);
				}
			}
			t.move = false;
		});
		
		this._attach(document.body, 'mousemove', function(ev) {
			if (t.move) {
				t._preventDefault(ev);
				var slider_width = t.slider.clientWidth, width = t.container.clientWidth - slider_width;
				var diff = t.move.mouse - ev.pageX;
				var left = t.move.left - diff;
				left = left < 0-(slider_width/2) ? 0-(slider_width/2) : ( left > width ? width : left );
				t.slider.style.left = left + 'px';
				
				for (f in t._move) {
					t._move[f](t);
				}
			}
		});
		
		this._attach(this.slider, 'click', t._preventDefault);
		this._attach(this.slider, 'mousedown', function(ev) {
			t._preventDefault(ev);
			t.move = {
				left: parseFloat(t.slider.style.left),
				mouse: ev.pageX
			};
			
			for (f in t._start) {
				t._start[f](t);
			}
		});
		window.setTimeout(function() {
			if (typeof(t.slider.style.left) == 'undefined') {
				t.slider.style.left = (0 - (t.slider.clientWidth / 2)) + 'px';
			}
		}, 100);
	},
	
	/**
	 * Connects an event on an DOMElement.
	 * 
	 * @param DOMElement element
	 *   Element to attach the event onto.
	 * @param string type
	 *   Event to catch on the given element.
	 * @param function handler
	 *   The function to call when the event is fired.
	 */
	_attach: function(element, type, handler) {
		if (element.addEventListener) {
			element.addEventListener(type, handler, false);
		} else {
			element.attachEvent('on' + type, handler);
		}
	},
	
	/**
	 * Prevent all future propagation and boubbling on the given event.
	 * 
	 * @param DOMEvent ev
	 *   The event to cancel.
	 */
	_preventDefault: function(ev) {
		ev = ev || ev.event;
		ev.cancelBubble = true;
		if (ev.stopPropagation) { ev.stopPropagation(); };
		if (ev.preventDefault) { ev.preventDefault(); };
		ev.returnValue = false;
	},
	
	/**
	 * Dummy to prevent syntax/parsing errors in case of last ',' after a function.
	 */
	__last__: 0
};
