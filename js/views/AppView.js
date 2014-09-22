define(['pv', 'spv', 'jquery'], function (pv, spv, $) {
"use strict";
var OptionsCtrl = function OptionsCtrl() {};
pv.View.extendTo(OptionsCtrl, {
	bindBase: function() {
		console.log(133);
	},

	toggleVisState: function(state, boolen) {
		var new_value;
		if (typeof boolen == 'undefined'){
			new_value = !this.state('vis_' + state);
		} else {
			new_value = !!boolen;
		}
		this.setVisState(state, new_value);
	},
	toggleVisStateTPL: function(e, node, data) {
		var boolen = data[2];
		this.toggleVisState(data[1], boolen);
	},
	tpl_events: {
		toggleVisState: function(e, node, data) {
			this.toggleVisStateTPL(e, node, data);
		},
		selectRadioState: function(e, node) {
			var value = node.value;
			var num_value = value * 1;

			this.RPCLegacy('updateState', node.name, num_value == value ? num_value: value);
		}
	}
});


var ListItemCtrl = function ListItemCtrl() {};
pv.View.extendTo(ListItemCtrl, {
	tpl_events: {
		selectToConfigurate: function(e) {
			this.RPCLegacy('selectToConfigurate', e.ctrlKey);
		}
	}
});



var AppView = function AppView() {};
pv.BaseRootView.extendTo(AppView, {
	createDetails: function() {
		this.root_view = this;
		this.d = this.opts.d;
		this.struc_store = {};

		var _this = this;

		spv.domReady(this.d, function() {
			_this.useBase($(_this.d).find('#app-root'));

			_this.connectStates();
			_this.connectChildrenModels();
			_this.requestAll();
		});

	},
	children_views_by_mn: {
		selected_column: {
			NumberColumnOptions: OptionsCtrl,
			TextColumnOptions: OptionsCtrl,
			DateColumnOptions: OptionsCtrl
		}
	},
	children_views: {
		'sorted_colums': ListItemCtrl,
		'active_columns_sorted': ListItemCtrl,
		'selected_column': OptionsCtrl
	}
	/*'collch-selected_column': {
		by_model_name: true,
	}*/
});
return AppView;

});