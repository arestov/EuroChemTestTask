define(['pv', 'spv', 'jquery', './modules/WPBox'], function (pv, spv, $, WPBox) {
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
	'stch-is_waypoint': function(state) {
		if (state) {
			this.RPCLegacy('selectToConfigurate', state == 'multi');
		} else {
			this.RPCLegacy('deselectToConfigurate');
		}
	},
	'stch-is_last_waypoint': function(state) {
		if (state) {
			//var con = this.c[0];
			//con.scrollIntoView(true);
		}
	},
	tpl_events: {
		selectToConfigurate: function(e) {
			this.RPCLegacy('selectToConfigurate', e.ctrlKey);
		},
		wpchActive: function(e) {
			this.updateState('is_waypoint', e.is_active && (e.items_num > 1 ? 'multi' : 'usual'));
			//items_num
		},
		wpchLast: function(e) {
			this.updateState('is_last_waypoint', e.is_last);
		},
		waypointPress: function() {
			this.RPCLegacy('addToActivatedList');
			
		}
	}
});



var AppView = function AppView() {};
pv.BaseRootView.extendTo(AppView, {
	createDetails: function() {
		this.root_view = this;
		this.d = this.opts.d;
		var d = this.d;
		this.struc_store = {};

		var _this = this;

		var last = function(array) {
			return array && array[ array.length - 1];
		};

		spv.domReady(this.d, function() {
			_this.useBase($(_this.d).find('#app-root'));

			_this.connectStates();
			_this.connectChildrenModels();
			_this.requestAll();
		});

		this.wp_box = new WPBox();
		this.wp_box.init(this, function() {
			return _this.getNesting('current_mp_md');
		}, function(waypoint, e) {
			//debugger;

			if (e.shiftKey) {
				if (!waypoint) {
					return;
				}
				var current = _this.state('vis_current_wpoint');
				current = (current && current.slice()) || [];

				if (current[current.length - 2] == waypoint) {
					current.pop();
					_this.setVisState('current_wpoint', current);
				} else {
					var pos = current.indexOf(waypoint);
					if (pos == -1) {
						current.push(waypoint);
						_this.setVisState('current_wpoint', current);
					} else {
						current.splice(pos, 1);
						_this.setVisState('current_wpoint', current);
					}
					
				}

				

			} else {
				_this.setVisState('current_wpoint', waypoint && [waypoint]);
			}
			_this.setVisState('last_wpoint', waypoint);
			
		}, function() {
			var array = _this.state('vis_current_wpoint');
			if (array) {
				var eventObj = {
					type: 'waypointPress',
					items_num: array.length
				};
				for (var i = 0; i < array.length; i++) {
					$(array[i].node).trigger(eventObj);
				}
			}

			/*$(twp.node).click();
			$(twp.node).trigger('activate_waypoint');

			setTimeout(function() {
				var array = _this.state('vis_current_wpoint');
				var lastwp = last(array);
				if (lastwp != twp) {
					return;
				}
				var still_in_use = _this.wp_box.isWPAvailable(twp);
				if (still_in_use){
					//_this.scrollToWP(still_in_use);
				} else {
					array.pop();
					_this.setVisState('current_wpoint', array.slice());
				}
			},100);*/
		}, function() {
			return _this.state('vis_last_wpoint');
		}, function(wp) {
			var array = _this.state('vis_current_wpoint');
			var cur_wp = last(array);
			if (cur_wp == wp) {
				array.pop();
				_this.setVisState('current_wpoint', array.slice());
			}

			var last_wp = _this.state('vis_last_wpoint');
			if (wp == last_wp) {
				_this.setVisState('last_wpoint', false);
			}
		});

		var resetWP = function() {
			_this.setVisState('last_wpoint', false);
			_this.setVisState('current_wpoint', false);
		};



		var kd_callback = function(e){
			if (d.activeElement && d.activeElement.nodeName == 'BUTTON'){return;}
			if (d.activeElement && d.activeElement.nodeName == 'INPUT'){
				if (e.keyCode == 27) {
					d.activeElement.blur();
					e.preventDefault();
					return;
				}
			}

			_this.arrowsKeysNav(e);
			if (e.keyCode == 27) {
				resetWP();
			}
		};

		$(d).on('keydown', kd_callback);

		_this.onDie(function() {
			$(d).off('keydown', kd_callback);
		});

	},
	inputs_names: ['input'],
	key_codes_map:{
		'13': 'Enter',
		'37': 'Left',
		'39': 'Right',
		'40': 'Down',
		'63233': 'Down',
		'38': 'Up',
		'63232': 'Up'
	},
	arrowsKeysNav: function(e) {
		var
			key_name,
			_key = e.keyCode;

		var allow_pd;
		if (this.inputs_names.indexOf(e.target.nodeName.toLowerCase()) == -1){
			allow_pd = true;
		}
		key_name = this.key_codes_map[e.keyCode];

		if (key_name && allow_pd){
			e.preventDefault();
		}
		if (key_name){
			//this.RPCLegacy('keyNav', key_name);
			this.wp_box.wayPointsNav(key_name, e);
		}
	},
	'stch-vis_last_wpoint': function(state, oldstate) {
		if (oldstate) {
			$(oldstate.node).trigger({
				type: 'wpchLast',
				is_last: false
			});
		}
		if (state) {
			$(state.node).trigger({
				type: 'wpchLast',
				is_last: true
			});
		}
	},
	'stch-vis_current_wpoint': function(n_array, o_array) {
		var i;
		if (o_array) {
			var to_remove = n_array ? spv.arrayExclude(o_array, n_array) : o_array;
			for (i = 0; i < to_remove.length; i++) {
				//$(to_remove[i].node).removeClass('surf_nav surf_nav_twice');
				$(to_remove[i].node).trigger({
					type: 'wpchActive',
					is_active: false,
				});
				//
				//
			}
		}
		if (n_array) {
			var to_mark = o_array ? spv.arrayExclude(n_array, o_array) : n_array;

			for (i = 0; i < to_mark.length; i++) {
				//$(to_mark[i].node).addClass('surf_nav surf_nav_twice');
				$(to_mark[i].node).trigger({
					type: 'wpchActive',
					is_active: true,
					items_num: n_array.length
				});
				
			}
			
		}
		/*if (ost){
			
		}
		if (nst) {
			
			//if (nst.view.getRooConPresentation(this) ==)
			//this.scrollToWP(nst);
			//
		}*/
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