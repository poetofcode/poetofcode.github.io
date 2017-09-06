$(function() {

	//
	// DEFINITIONS
	//

	var prettyColors = ['Spectral', 'PuOr', 'PRGn', 'GnBu', 'YlOrBr'];    
	var fabColors = ['#1976D2', '#8079B7', '#32c36e', '#3897c4', '#F79D37'];
	var fabAnimDuration = 700;
	
	var currColorIdx = 0;

	var fabIconAnim = anime({
		targets: '.fab .icon',
		rotate: '360deg',
		easing: 'linear',
		duration: fabAnimDuration,
		autoplay: false
	});

	function generateCanvas(color) {
		if(typeof Trianglify == 'undefined') return;

		var pattern = Trianglify({
			width: screen.width > 200 ? screen.width : 1600,
			height: 200,
			x_colors: color,
			y_colors: 'match_x'
		});

		return pattern.png();
	}

	function initCanvasAndFab() {
		var idx = getCookie('pcb_color_index');
		if (typeof idx != 'undefined' && idx >= 0 && idx < fabColors.length) {
			currColorIdx = idx;
		}

		var png = generateCanvas(prettyColors[currColorIdx]);
		replaceCanvas(png);

		$('.fab').css('background-color', fabColors[currColorIdx]);
	}

	function updateRndCanvas() {
		var png = generateCanvas(pickRandom(prettyColors));
		replaceCanvas(png);
	}

	function replaceCanvas(png) {
		$('.intro').css('background-image', 'url({png})'.replace('{png}', png));
	}

	function pickRandom(arr) {
		var idx = getRandomArbitrary(0, arr.length-1);
		return arr[idx];
	}

	function getRandomArbitrary(min, max) {
		return Math.round(Math.random() * (max - min) + min);
	}

	// Source: https://stackoverflow.com/questions/487073/check-if-element-is-visible-after-scrolling
	function isScrolledIntoView(elem)
	{
		var docViewTop = $(window).scrollTop();
		var docViewBottom = docViewTop + $(window).height();

		var elemTop = $(elem).offset().top;
		var elemBottom = elemTop + $(elem).height();

		return ((elemBottom <= docViewBottom) && (elemBottom >= docViewTop));
	}

	// https://learn.javascript.ru/cookie
	function getCookie(name) {
		var matches = document.cookie.match(new RegExp(
			"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
			));
		return matches ? decodeURIComponent(matches[1]) : undefined;
	}

	function setCookie(name, value, options) {
		options = options || {};

		var expires = options.expires;

		if (typeof expires == "number" && expires) {
			var d = new Date();
			d.setTime(d.getTime() + expires * 1000);
			expires = options.expires = d;
		}
		if (expires && expires.toUTCString) {
			options.expires = expires.toUTCString();
		}

		value = encodeURIComponent(value);

		var updatedCookie = name + "=" + value;

		for (var propName in options) {
			updatedCookie += "; " + propName;
			var propValue = options[propName];
			if (propValue !== true) {
				updatedCookie += "=" + propValue;
			}
		}

		document.cookie = updatedCookie;
	}

	//
	// HANDLERS
	//

	// $('.fab').click(function() {
	// 	currColorIdx++;
	// 	if(currColorIdx > fabColors.length-1) {
	// 		currColorIdx = 0;
	// 	}

	// 	var fabButtonAnim = anime({
	// 		targets: '.fab',
	// 		easing: 'linear',
	// 		duration: fabAnimDuration,
	// 		autoplay: false,
	// 		backgroundColor: fabColors[currColorIdx],
	// 		begin: function() {
	// 			fabIconAnim.restart();
	// 		},
	// 		complete: function() {
	// 			var png = generateCanvas(prettyColors[currColorIdx]);
	// 			replaceCanvas(png);
	// 			setCookie('pcb_color_index', currColorIdx);
	// 		}
	// 	});

	// 	fabButtonAnim.restart();
	// });

	// $(document).scroll(function() {
	// 	if(isScrolledIntoView('.intro')) {
	// 		$('.fab').addClass('visible');
	// 		return;
	// 	}

	// 	$('.fab').removeClass('visible');	
	// });

	//
	// Main running part
	//

	// initCanvasAndFab();

	// if(isScrolledIntoView('.intro')) {
	// 	$('.fab').addClass('visible');
	// }

	// replaceCanvas(generateCanvas(prettyColors[0]));
});