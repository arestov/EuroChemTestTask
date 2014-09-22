(function(){
"use strict";
requirejs.config({
	paths: {
		pv: 'js/libs/provoda',
		spv: 'js/libs/spv',
		app: 'js/app',
		jquery: 'js/common-libs/jquery-2.1.0.min',
	//	localizer: 'js/libs/localizer',
	//	cache_ajax: 'js/libs/cache_ajax',
	//	app_env: "js/app_env",
		hex_md5: 'js/common-libs/md5.min',
		angbo: 'js/libs/StatementsAngularParser.min'
	},
	shim: {
		hex_md5: {
			exports: 'hex_md5'
		}
	}
});

(function() {
	requirejs(['pv', 'app', 'js/views/AppView'], function(pv, app, AppView) {
		pv.initWebApp(app, AppView);
	});
})();



})();
