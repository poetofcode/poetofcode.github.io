(function($) {

	$.jsImpression = function(element, options) {
		this.options = {};

		element.data('jsImpression', this);

		this.init = function(element, options) {
			this.options = $.extend({}, $.jsImpression.defaultOptions, options);
			setElementClasses(element);
			startAnimation(element, this.options);
		};
   
		this.init(element, options);
	};
 
 	function setElementClasses(element) {
 		element.addClass('jsimpression-container');
 	}

	function startAnimation(element, options) {
		setInterval(
			function() {

				var active = $(element).find('img.active');
				var next;

				if ( active.length == 0 ) 
				{
					active = $(element).find('img:last');
				}
				if ( active.next().length != 0 ) 
				{
					next = active.next();
				} else {
					next = $(element).find('img:first');
				}
				active.addClass('last-active');

				next.css({opacity: 0.0})
				    .addClass('active')
				    .animate({opacity: 1.0}, 1000, function() {
				        active.removeClass('active last-active');
				    });
			},
			options.interval);
	}

	$.jsImpression.defaultOptions = {
		interval: 6000
	}

	$.fn.jsImpression = function(options) {
		return this.each(function() {
		  (new $.jsImpression($(this), options));
		});
	};

})(jQuery);