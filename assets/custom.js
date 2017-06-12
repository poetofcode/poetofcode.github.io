$(function() {

	//
	// DEFINITIONS
	//

	var prettyColors = ['Spectral', 'PRGn', 'PuOr', 'GnBu', 'YlOrBr'];    
	var fabColors = ['#1976D2', '#53A45B', '#8079B7', '#3897c4', '#F79D37'];
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

	$('.fab').click(function() {
		currColorIdx++;
		if(currColorIdx > fabColors.length-1) {
			currColorIdx = 0;
		}

		var fabButtonAnim = anime({
			targets: '.fab',
			easing: 'linear',
			duration: fabAnimDuration,
			autoplay: false,
			backgroundColor: fabColors[currColorIdx],
			begin: function() {
				fabIconAnim.restart();
			},
			complete: function() {
				var png = generateCanvas(prettyColors[currColorIdx]);
				replaceCanvas(png);
			}
		});

		fabButtonAnim.restart();
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