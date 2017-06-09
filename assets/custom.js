$(function() {

	//
	// DEFINITIONS
	//

	var prettyColors = ['Spectral', 'YlGnBu', 'GnBu', 'PRGn', 'PuOr', 'Blues'];    

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

	function initCanvas() {
		var png = generateCanvas(prettyColors[0]);
		replaceCanvas(png);
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


	//
	// HANDLERS
	//

	var fabAnim = anime({
		targets: '.fab .icon',
		rotate: '-180deg',
		easing: 'linear',
		duration: 500,
		complete: function() {
			updateRndCanvas();	
		},
		autoplay: false
	});

	$('.fab').click(function() {
		fabAnim.restart();
	});

	$(document).scroll(function() {
		if(isScrolledIntoView('.intro')) {
			$('.fab').addClass('visible');
			return;
		}

		$('.fab').removeClass('visible');	
	});

	//
	// Main running part
	//

	initCanvas();

	if(isScrolledIntoView('.intro')) {
		$('.fab').addClass('visible');
	}

});