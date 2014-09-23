define(['pv', 'spv', 'jquery', 'js/models/LoadableListBase', 'js/modules/parseCVS', 'js/models/columns-ns'], function(pv, spv, $, LoadableListBase, csv, columnsNS) {
"use strict";
var wd  = window;
var localLang = wd ?
	(wd.navigator.language || wd.navigator.browserLanguage).slice(0,2).toLowerCase() :
	'en';


var getMulticolumnInputs = function(columns) {
	var index = {};
	var array = [];
	var i, cur;
	for (i = 0; i < columns.length; i++) {
		//ищем модели с уникальным набором inputs
		cur = columns[i];
		var modelName = cur.model_name;
		if (!index[modelName]) {
			index[modelName] = true;
			array.push(cur);
		}
	}
	var inputsIndex = {};
	for (i = 0; i < array.length; i++) {
		//ищем инпуты, которые есть у каждой уникальной модели
		cur = array[i];
		for (var jj = 0; jj  < cur.availableInputs.length; jj++) {
			var inputType = cur.availableInputs[jj];
			if (!inputsIndex[ inputType ]) {
				inputsIndex[ inputType ] = 0;
			}
			inputsIndex[ inputType ]++;
		}

	}

	var result = [];
	for (var input in inputsIndex) {
		if (inputsIndex[input] == array.length) {
			result.push(input);
		}
	}

	return columnsNS.getInputsConf(result);

};



var createCVSHeadConv = function(cvsHead) {
	var result = {};
	for (var i = 0; i < cvsHead.length; i++) {
		result[cvsHead[i].trim()] = i.toString();
	}
	return result;
};

var convertCVS = function(r) {
	var cvsTable = csv(r);
	var convMap = createCVSHeadConv( cvsTable[0] );
	if (convMap.name) {
		convMap.name = [function(value) {
			return JSON.parse(value.replace(/\\/gi, ''));
		}, convMap.name];
	}

	var convert = spv.mmap({
		props_map: convMap
	});
	var restArray = cvsTable.slice(1);
	var result = new Array( restArray.length );
	for (var i = 0; i < result.length; i++) {
		result[i] = convert( restArray[i] );
	}
	return result;
};



var columnsSortFuntions = {
	'alphabet_asc': spv.getSortFunc([{
		field: 'states.local_name',
	}]),
	'alphabet_desc': spv.getSortFunc([{
		field: 'states.local_name',
		reverse: true
	}]),
	'definition': spv.getSortFunc([{
		field: 'states.id'
	}]),

};
var columnsSortings = ['alphabet_asc', 'alphabet_desc', 'definition'];


var remarkState = function(value, oldValue, stateName) {
	var i;
	var removed = oldValue && pv.getRemovedNestingItems(value, oldValue);
	if (removed) {
		for (i = 0; i < removed.length; i++) {
			removed[i].updateState(stateName, false);
		}
	}
	if (value) {
		for (i = 0; i < value.length; i++) {
			value[i].updateState(stateName, true);
		}
	}
};
var simpleNestingCheck = function(md, stateName) {
	if (md.state(stateName)) {
		return true;
	}
};

var bindNestingFlows = function(md, donorNestingName, stateName, check, targetNestingName) {

	var checkFunc = check || simpleNestingCheck;
	md.watchChildrenStates(donorNestingName, stateName, function(e) {
		var result = [];
		for (var i = 0; i < e.items.length; i++) {
			if ( checkFunc( e.items[i], stateName ) ) {
				result.push( e.items[i] );
			}
		}
		this.updateNesting(targetNestingName, result);
	});
};


var sortByTypeOrder = spv.getSortFunc([{
	field: 'states.type_order'
}]);


var AppModel = function AppModel() {};
LoadableListBase.extendTo(AppModel, {
	zero_map_level: true,
	localLang: localLang,
	init: function() {
		this.app = this;
		this._super();
		this.initStates({
			title: 'Конфигуратор',
			columnsSorting: columnsSortings[0]
		});
		this._saved_selected_columns = null;
		this._saved_active_columns = null;
		this.multiColumn = this.initSi(columnsNS.MultiColumnsOptions);
		
		this.on('child_change-selected_columns', function(e) {
			var old_value = this._saved_selected_columns;
			this._saved_selected_columns = e.value;
			remarkState(e.value, old_value, 'selected_to_conf');
		});

		this.on('child_change-selected_columns', function(e) {
			if (!e.value) {
				this.updateNesting('selected_column', null);
			} else {
				if (e.value.length > 1) {
					var inputs = getMulticolumnInputs(e.value);

					this.multiColumn.updateNesting('columns', e.value.slice());
					this.multiColumn.updateManyStates({
						availableInputs: inputs.array,
						availableInputsIndex: inputs.index
					});
					this.updateNesting('selected_column', this.multiColumn);
				} else {
					this.updateNesting('selected_column', e.value.length === 1 && e.value[0]);
					//this.updateNesting('selected_multicolumn', null);
				}
			}
		});
		this.on('child_change-active_columns', function(e) {
			var old_value = this._saved_active_columns;
			this._saved_active_columns = e.value;
			remarkState(e.value, old_value, 'columnIsActive');
		});
		bindNestingFlows(this, 'active_columns', 'has_comparing', null, 'comparingColumns');

		this.watchChildrenStates('active_columns', 'type_order', function(e) {
			var result = e.items && e.items.slice().sort(sortByTypeOrder);
			this.updateNesting('active_columns_sorted', result);
		});

		this.requestMoreData('columns');

	},
	'compx-selected_columns_length': [
		['@selected_columns'],
		function (array) {
			return array && array.length;
		}
	],
	'nest_rqc-columns': ['type', {
		'number': columnsNS.NumberColumnOptions,
		'text': columnsNS.TextColumnOptions,
		'date': columnsNS.DateColumnOptions,
		'datetime': columnsNS.DateColumnOptions,
		'url': columnsNS.TextColumnOptions
	}],
	'nest_req-columns': [
		[
			//парсинг ответа, должна вернуть массив с преобразованными данными
			convertCVS
		],
		[function () {
			return {
				api_name: 'cvs',
				source_name: 'cvs',
				get: function(url) {
					//функция должна вернуть promise
					return $.ajax({
						url: url,
						type: "GET",
						dataType: "text"
					});
				},
				errors_fields: []
			};
		}, 'get', function() {
			return ['./data/columns_of_sales_plan.csv'];
		}]
	],
	'compx-sorted_colums': [
		['@columns', 'columnsSorting', 'columnsQuery'],
		function (columns, columnsSorting, columnsQuery) {
			//функция вызывается при изменении коллекции columns,
			//а также при изменении состояний columnsSorting или columnsQuery
			//а результат записывается в состояние sorted_colums
			if (!columns) {
				return;
			}
			if (columnsQuery) {
				return spv.searchInArray(columns, columnsQuery, ['states.local_name']);
			} else {
				var sortFunc = columnsSortFuntions[columnsSorting || 'alphabet_asc'];
				return columns && columns.slice().sort(sortFunc);
			}
		}
	],
	'stch-sorted_colums': function(state) {
		//при изменении состояния sorted_colums 
		//его значение записывается в коллекцию/гнездо с одноименным названием
		this.updateNesting('sorted_colums', state);
	},
	'compx-columnsSortingDesc': [
		['columnsSorting'],
		function (state) {
			return ({
				'alphabet_asc': 'by alphabet ↑',
				'alphabet_desc': 'by alphabet ↓',
				'definition': 'by definition'
			})[state];
		}
	],
	removeColumnFromActivatedList: function(column) {
		var array = this.getNesting('active_columns') || [];
		this.updateNesting('active_columns', spv.arrayExclude(array, column));
	},
	addColumnToActivatedList: function(column) {
		var array = this.getNesting('active_columns') || [];

		this.updateNesting('active_columns', spv.collapseAll(array, column));

	},
	setUserColumnsQuery: function(query) {
		this.updateState('columnsQuery', query);
	},
	deselectColumnToConfigurate: function(column) {
		var array = this.getNesting('selected_columns') || [];
		this.updateNesting('selected_columns', spv.arrayExclude(array, column));
	},
	selectColumnToConfigurate: function(column, mutliSelect) {
		if (mutliSelect) {
			var array = this.getNesting('selected_columns') || [];
			if (array.indexOf(column) == -1) {
				array.push(column);
				this.updateNesting('selected_columns', array);
			}

		} else {
			this.updateNesting('selected_columns', [column]);
		}
		
	},
	switchColumsSorting: function() {
		var current = this.state('columnsSorting');
		var order_num = columnsSortings.indexOf(current);
		var target_num = order_num + 1;
		var target_sorting = columnsSortings[target_num] || columnsSortings[0];
		this.updateState('columnsSorting', target_sorting);
	},
	'compx-comparingColumnsByCalcNum': [
		['@comparingColumns'],
		function (list) {

			return list && spv.filter(list, 'states.has_comparing', 'calc').length;
		}
	]
	
});




var app = window.app = new AppModel();
app.init();
return app;

});