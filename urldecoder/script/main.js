$(function() {

	$('#calc').click(function() {
		var src = $('textarea').val();
		var base = $('input').val();
		if (base == '') {
			base = 'localhost/';
		}

		try {
		   var res = encodeURL(base, src);
		   $('#result').text(res);
		}
		catch (e) {
		   $('#result').html('<span class="error">{error}</span>'.replace('{error}', e));
		}
	});

});