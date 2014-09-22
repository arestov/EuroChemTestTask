define(['pv'], function (pv) {
"use strict";

var MultiColumnsOptions = function MultiColumnsOptions() {};
pv.HModel.extendTo(MultiColumnsOptions, {

	removeFromActive: function() {
		this.map_parent.removeColumnFromActivatedList(this.getNesting('columns'));
	},
	addToActive: function() {
		this.map_parent.addColumnToActivatedList(this.getNesting('columns'));
	},
	'compx-can_add_to_active': [
		['@every:columnIsActive:columns'],
		function (state) {
			return !state;
		}
	],
	'compx-can_remove_from_active': [
		['@some:columnIsActive:columns'],
		function (state) {
			return state;
		}
	],
	'compx-comparingColumnsByCalcNum': [
		['#comparingColumnsByCalcNum'],
		function (state) {
			return state;
		}
	]
});

var ColumnOptions = function ColumnOptions() {};
pv.HModel.extendTo(ColumnOptions, {
	init: function(opts, data) {
		this._super.apply(this, arguments);
		this.init_states.availableInputsIndex = this.availableInputsIndex;
		this.init_states.columnIsActive = false;
		this.init_states.selected_to_conf = false;
		this.init_states.simple_grouping = false;
		this.initStates(data);
	},
	'compx-local_name': [
		['name'],
		function(state) {
			return state && ( state[this.app.localLang] || state['en'] );
		}
	],
	'compx-can_add_to_active': [
		['columnIsActive'],
		function (state) {
			return !state;
		}
	],
	'compx-can_remove_from_active': [
		['columnIsActive'],
		function (state) {
			return state;
		}
	],
	'compx-has_comparing': [
		['date_compare', 'simple_compare'],
		function (date_compare, simple_compare) {
			return date_compare || simple_compare;
		}
	],
	'compx-has_grouping': [
		['date_grouping', 'simple_grouping'],
		function (date_grouping, simple_grouping) {
			return date_grouping || simple_grouping;
		}
	],
	'compx-type_order': [
		['has_comparing', 'has_grouping'],
		function (has_comparing, has_grouping) {
			if (has_comparing) {
				return 1;
			} else if (has_grouping) {
				return 2;
			} else {
				return 3;
			}
		}
	],

	removeFromActive: function() {
		this.map_parent.removeColumnFromActivatedList(this);
	},
	addToActive: function() {
		this.addToActivatedList();
	},
	addToActivatedList: function() {
		this.map_parent.addColumnToActivatedList(this);
	},
	selectToConfigurate: function(mutliSelect) {
		this.map_parent.selectColumnToConfigurate(this, mutliSelect);
	},
	deselectToConfigurate: function() {
		this.map_parent.deselectColumnToConfigurate(this);
	},
	'compx-comparingColumnsByCalcNum': [
		['#comparingColumnsByCalcNum'],
		function (state) {
			return state;
		}
	]
});

var getInputsConf = function(array) {
	var index = {};
	for (var i = 0; i < array.length; i++) {
		index[array[i]] = true;
	}

	return {
		array: array,
		index: index
	};
};


var NumberColumnOptions = function NumberColumnOptions() {};
(function() {
	var inputs = getInputsConf([
		'sorting',
		'simple_grouping',
		'num_calculation',
		'num_filter',
		'num_format'
	]);
	ColumnOptions.extendTo(NumberColumnOptions, {
		model_name: 'NumberColumnOptions',
		availableInputs: inputs.array,
		availableInputsIndex: inputs.index
	});
})();

var TextColumnOptions = function TextColumnOptions() {};
(function() {
	var inputs = getInputsConf([
		'sorting',
		'simple_grouping',
		'simple_compare',
		'text_filter'
	]);
	ColumnOptions.extendTo(TextColumnOptions, {
		model_name: 'TextColumnOptions',
		availableInputs: inputs.array,
		availableInputsIndex: inputs.index
	});
})();

var DateColumnOptions = function DateColumnOptions() {};
(function() {
	var inputs = getInputsConf([
		'sorting',
		'date_grouping',
		'date_compare',
		'unknown_calculation',
		'num_filter',
		'date_format'
	]);
	ColumnOptions.extendTo(DateColumnOptions, {
		model_name: 'DateColumnOptions',
		availableInputs: inputs.array,
		availableInputsIndex: inputs.index
	});
})();

return {
	MultiColumnsOptions: MultiColumnsOptions,
	NumberColumnOptions: NumberColumnOptions,
	TextColumnOptions: TextColumnOptions,
	DateColumnOptions: DateColumnOptions,
	getInputsConf: getInputsConf
};

});