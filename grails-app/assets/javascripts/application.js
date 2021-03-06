// This is a manifest file that loads the javascript files needed for the non-gameplay aspects.
//
// Any JavaScript file within this directory can be referenced here using a relative path.
//
//= require jquery.min.js
//= require jquery-ui.min.js
//= require jquery.ui.touch-punch.min.js
//= require jquery.form.js
//= require_self

if (typeof jQuery !== 'undefined') {
	(function($) {
		$('#spinner').ajaxStart(function() {
			$(this).fadeIn();
		}).ajaxStop(function() {
			$(this).fadeOut();
		});
	})(jQuery);
}

//Wait for DOM to load and init functions
$(window).ready(function(){ 
	init(); 
});

function init(){
	// make the spinner show while ajax is going on
	$(document)
		.ajaxStart(function() {
			$("#spinner").fadeIn('slow');
		})
		.ajaxComplete(function() {
			$("#spinner").fadeOut('slow');
		});
	
	// TODO: figure out how to use ajax form without getting duplication of page contents 
	/*$('#loginForm').ajaxForm(function(result) {
		$('#loginBox').html(result);
	});*/
}