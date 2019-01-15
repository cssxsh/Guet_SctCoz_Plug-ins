// ==UserScript==
// @name         Interface Optimization
// @namespace    https://github.com/cssxsh/Guet_SctCoz_Plug-ins
// @version      0.2.3
// @description  对选课系统做一些优化
// @author       cssxsh
// @include      http://bkjw.guet.edu.cn/Login/MainDesktop
// @include      http://172.16.13.22/Login/MainDesktop
// @updateURL    https://github.com/cssxsh/Guet_SctCoz_Plug-ins/raw/master/Interface_Optimization.js
// @grant        none
// ==/UserScript==

//启动接口
Ext.onReady(function () {
	//创建工具
	window.plugTools;
	if (window.plugTools == null) {
		window.plugTools = Ext.create("SctCoz.tools");
		plugTools.init();
	}
	var CourseSetNew = {
		action: "QryCourseSet",
		text: "课程设置",
		id: "QryCourseSet",
		listeners: {
			add: function (me, opt) {//这里用add方法不是很好，但是找不到合适的事件等待加载完毕
				//修正面板功能
				var qryfrm = me.down("fieldset"); //获取条件筛选面板
				qryfrm.add({width: 120, labelWidth: 35,  name: 'stid', fieldLabel: '学号'});
				var inputs = qryfrm.items.items;
				inputs.forEach(function (i) {
					i.editable = true;
				})
				// XTODO: 直接重写Grid

				var newGrid = Ext.create('Ext.grid.Panel', {
					columnLines: true,
					width: '100%',
					height: '100%',
					minHeight: 400,
					plugins: [Ext.create('Ext.grid.plugin.CellEditing', { clicksToEdit: 1 })],
					viewConfig: { forceFit: true, stripeRows: true , enableTextSelection: true},
					layout: 'fit',
					store: Ext.create('Edu.store.coursetables',{ pageSize: 500 }),
					columns: [
						{ header: "序号", xtype: 'rownumberer', width: 40 , sortable: false},
						{ header: "选中", dataIndex: "sct", width: 40, xtype: "checkcolumn", hidden: false, hidden: true, editor: { xtype: "checkbox", inputValue: true } },
						{ header: "年级", dataIndex: "grade", width: 50 },
						{ header: "专业", dataIndex: "spname", width: 120 },
						{ header: "课程序号", dataIndex: "courseno", width: 80 },
						{ header: "课程代码", dataIndex: "courseid", width: 94 },
						{ header: "课程名称", dataIndex: "cname", minWidth: 180, flex: 1 },
						{ header: "星期", dataIndex: "week", width: 40 },
						{ header: "节次", dataIndex: "sequence", width: 40 },
						{ header: "开始周", dataIndex: "startweek", width: 40 },
						{ header: "结束周", dataIndex: "endweek", width: 40 },
						{ header: "教室", dataIndex: "croomno",width: 70 },
						{ header: "教师", dataIndex: "name",width: 70 },
						{ header: "学分", dataIndex: "credithour", width: 40 },
						{ header: "理论学时", dataIndex: "teachperiod" , width: 40},
						{ header: "实验学时", dataIndex: "labperiod", width: 40},
						{ header: "上机学时", dataIndex: "copperiod", width: 40},
						{ header: "可选人数", dataIndex: "maxperson", width: 40 },
						{ header: "已选人数", dataIndex: "studentcount", width: 40 },
						{ header: "备注", dataIndex: "comment", flex:1}
					],
					tbar:[
						{ xtype: 'button', text: '打印', formBind: true, iconCls: 'print', handler: printGrid },
						{ xtype: 'button', text: '导出Excel', formBind: true, iconCls: 'excel', handler: expandGrid },
						{ xtype: 'button', text: '转为课表', formBind: true, icon: '/images/0775.gif', handler: openTimeTable}
					]
				});
				function printGrid() {
					Ext.ux.grid.Printer.mainTitle = qryfrm.getForm().findField("term").getRawValue() + "课程设置";
					Ext.ux.grid.Printer.print(grid);
				}
				function expandGrid() {
					Ext.ux.grid.Printer.mainTitle = qryfrm.getForm().findField("term").getRawValue() + "课程设置";
					Ext.ux.grid.Printer.ToExcel(grid);
				}
				var ctb = Ext.create('Edu.view.coursetable');
				function openTimeTable (me, opt) {
					var grid = me.up("grid");
					var gRec = grid.getStore().data.items.filter(function (item) {console.log(item.data.sct); return item.data.sct == true;});
					var panView = Ext.create('Ext.panel.Panel', { layout: 'fit', autoScroll: true, frame: true });
					Ext.create("Ext.window.Window", {
						title: "课程表", width: '80%', height:'80%', modal: true, resizable: false, layout: 'fit',
						items: [panView]
					}).show();
					ctb.render(panView.body, gRec);
				}
				function queryStore() {
					var form = me.down("fieldset").up("panel").getForm();
					var params = form.getValues();
					var sto = newGrid.getStore();
					var wk = getSplitArray(form.findField("startweek").getValue(), '..');
					params.startweek = wk[0];
					params.endweek = wk[1];
					wk = getSplitArray(form.findField("fromweek").getValue(), '..');
					params.fromweek = wk[0];
					params.toweek = wk[1];
					wk = getSplitArray(form.findField("startsequence").getValue(), '..');
					params.startsequence = wk[0];
					params.endsequence = wk[1];
					var sto_ = Ext.create('Edu.store.coursetables',{
						pageSize: 500,
						listeners: {
							load: function(st, rds, opts) {
								var data = sto_.data.items;
								data.forEach( function (t) {
									t.data.sct = true;
								});
								sto.loadData(data);
							}
						}
					});
					sto_.proxy.extraParams = params;
					sto_.load();
				}
				var oldGrid = me.down("grid");
				var panel = oldGrid.up("panel");
				var queryButton = me.down("fieldset").down("button");
				queryButton.handler = queryStore;
				panel.remove(oldGrid);
				panel.add(newGrid);
				/*
				//修正Grid功能
				var grid = me.down("grid");
				grid.columns.forEach(function (c) {
					c.sortable = true;
				});
				grid.columns[2].width = 120;
				var gridView = grid.getView();
				gridView.enableTextSelection = true;
				// TODO：为columns添加checkcolumn， 不过看样子要之接重写Grid
				var p = Ext.create('Ext.grid.plugin.CellEditing', { clicksToEdit: 1 });
				grid.headerCt.insert(1, Ext.create('Ext.grid.column.Column', { header: "有效", dataIndex: "enabled", xtype: 'checkcolumn', editor: { xtype: 'checkbox', inputValue: 1 } }));

				//grid.headerCt.addPlugin(p);
				//添加日程表功能
				var ctb = Ext.create('Edu.view.coursetable');
				var toolTbar = grid.down("toolbar");// 获取工具栏
				toolTbar.add({ xtype: 'button', text: '转为课表', formBind: true, icon: '/images/0775.gif', handler: openTimeTable});
				function openTimeTable (me, opt) {
					var grid = me.up("grid");
					var gRec = grid.getStore().data.items;
					var panView = Ext.create('Ext.panel.Panel', {layout: 'fit', autoScroll: true, frame: true});
					Ext.create("Ext.window.Window", {
						title: "课程表",
						width: '80%', height:'80%',modal: true, resizable: false, layout: 'fit',
						items: [panView]
					}).show();
					ctb.render(panView.body, gRec);
				}
				*/
			},
			activate: null
		}
	};
	var StuScoreNew = {
		action: "StuScore",
		text: "成绩查询",
		id: "StuScore",
		listeners: {
			add: function (me, opt) {
				//修正Grid功能
				var grid = me.down("grid");
				grid.columns.forEach(function (c) {
					c.sortable = true;
				});
				grid.columns[3].width = 60;
				grid.columns[4].minWidth = 120;
				grid.columns[4].width = 120;
				grid.headerCt.insert(5, Ext.create('Ext.grid.column.Column', { header: "考核成绩", dataIndex: "khcj", minWidth: 30 }));
				grid.headerCt.insert(5, Ext.create('Ext.grid.column.Column', { header: "期中成绩", dataIndex: "qzcj", minWidth: 30 , hidden: true}));
				grid.headerCt.insert(5, Ext.create('Ext.grid.column.Column', { header: "平时成绩", dataIndex: "pscj", minWidth: 30 }));
				grid.headerCt.insert(5, Ext.create('Ext.grid.column.Column', { header: "实验成绩", dataIndex: "sycj", minWidth: 30 , hidden: true}));
				var gridView = grid.getView();
				gridView.enableTextSelection = true;
			}
		}
	};

	plugTools.menuChange(CourseSetNew);
	plugTools.menuChange(StuScoreNew);
	//这里没有用通用方法
	//定义监视器
	var panel = Ext.getCmp("content_panel");
	panel.addListener("add", function () {
		var lastTab = panel.items.last();
		//console.log(lastTab);
		lastTab.addListener("add", function () {
			var grid = lastTab.down("grid");
			if (grid != null) {
				grid.columns.forEach(function (c) {
					c.sortable = true;
				});
				var gridView = grid.getView();
				gridView.enableTextSelection = true;
			}
		});
	});

});

Ext.define('SctCoz.tools', {
	config:{
		id: 'plug',
		version: "0.1.7",
	},
	SysMenus: null,
	Menus_Tree: null,
	newMenus: [],
	menuAdd: function (config) {
		console.log(config.action + "add...");
		var menu_config = {
			"action": config.action,
			"children": null,
			"command": null,
			"controller": "plug",
			"id": config.id,
			"leaf": true,
			"text": config.text,
			"type": "action",
		};
		this.Menus_Tree.appendChild(menu_config);
		this.newMenus.push(config);
	},
	menuChange: function (config) {
		console.log(config.action + " change...");
		var menu_config = {
			"action": config.action,
			"children": null,
			"command": null,
			"controller": "plug",
			"id": config.id,
			"leaf": true,
			"text": config.text,
			"type": "action",
		};
		this.newMenus.push(config);
	},
	getNewListeners: function (id) {
		var Listeners = {};
		this.newMenus.filter(function (item) { return item.id == id }).forEach(function (item) {
			Listeners = item.listeners;
		});
		if (Listeners.activate == null) {
			Listeners.activate = function (me, opts) {
				if (me.barChange) {
					me.barChange = false;
					me.loader.load();
				}
			}
		}
		return Listeners;
	},
	newOpenTab: function (panel, id, text, actid) {
		var tabPanel = Ext.getCmp("content_panel");
		var tabNodeId = tabPanel.down('[id=' + actid + ']');
		var Listeners = plugTools.getNewListeners(actid);
		if (!tabNodeId) {
			tabPanel.add({
				id: actid,
				title: text,
				layout:'fit',
				closable: true,
				childActId: actid,
				barChange: false,
				loader: {
					url: panel,
					loadMask: '请稍等...',
					autoLoad: true,
					scripts: true
				},
				listeners: Listeners
			}).show();
		}
		else {
			tabPanel.setActiveTab(tabNodeId);
		}
	},
	init: function () {
		//初始化
		console.log("ver "+ this.version + "   initing...");
		this.SysMenus = Ext.getCmp("SystemMenus");
		this.Menus_Tree = this.SysMenus.down("treeview").node;
		//重载打开Tab的方法
		this.SysMenus.openTab = this.newOpenTab;
	}
});