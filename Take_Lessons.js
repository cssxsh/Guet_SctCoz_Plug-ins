// ==UserScript==
// @name         Take Lessons
// @namespace    https://github.com/cssxsh/Guet_SctCoz_Plug-ins
// @version      0.3.5.7
// @description  新教务抢课脚本
// @author       cssxsh
// @include      http://bkjw.guet.edu.cn/Login/MainDesktop
// @include      http://172.16.13.22/Login/MainDesktop
// @updateURL    https://github.com/cssxsh/Guet_SctCoz_Plug-ins/raw/master/Take_Lessons.js
// @grant        none
// ==/UserScript==

//一些参数
var col = {
	time: 1000,        //抢课时间间隔
	old_hide: true,    //旧模块是否隐藏
	overflow: false,   //关闭以课程人数已满为继续抢课条件
	allcourseno: true  //开启全课号
};
//启动接口
Ext.onReady(function () {
	//创建工具
	window.plugTools;
	if (window.plugTools == null) {
		window.plugTools = Ext.create("SctCoz.tools");
		plugTools.init();
	}
	//console.log("抢课脚本Bug真的多。");
	var StuSct = {
		action: "StuSct",
		text: "选课",
		id: "StuSct",
		listeners: {
			afterrender: function (me, opt){ Rreplace_StuSct("StuSct") },
			activate: null
		}
	}
	var StuSctCx = {
		action: "StuSctCx",
		text: "重学选课",
		id: "StuSctCx",
		listeners: {
			afterrender: function (me, opt) { Rreplace_StuSct("StuSctCx") },
			activate: null
		}
	}
	plugTools.menuChange(StuSct);
	plugTools.menuChange(StuSctCx);
});
function Rreplace_StuSct (module) {
	//判断模块是否符合
	var scttype = '';
	switch (module) {
		case ('StuSct'):
			scttype = '正常';
			break;
		case ('StuSctCx'):
			scttype = '重修';
			break;
		default :
			//不符合要求退出
			return ;
	}
	//加载修改过的功能
	Ext.QuickTips.init();
	Ext.form.Field.prototype.MsgTarget = 'side';

	var dptSto = Ext.data.StoreManager.lookup('dptSto');

	var tmSto = Ext.data.StoreManager.lookup('xqSto');
	var spSto = Ext.create('Edu.store.Spinfo');
	function sctDpt(cmb, rec) {
		var dpt = rec[0].data.dptno;
		spSto.clearFilter();
		spSto.filter('dptno', new RegExp('^' + dpt + '$'));
		qryfrm.getForm().findField("spno").setValue("");
	}
	var qryfrm = Ext.create('Edu.view.QueryForm',{
		url:'/student/StuInfo',
		labelWidth: 60,
		argcols: [{
			xtype: 'termcombo',
			store: tmSto,
			value: getTerm()[1],
			allowBlank: false,
			labelWidth:30,
			readOnly: true
		}, {
			xtype: 'gradecombo',
			allowBlank: false,
			labelWidth: 30,
			width: 120,
			size: 6
		}, {
			xtype: 'dptcombo',
			store: dptSto,
			fieldLabel: '开课学院',
			editable: false,
			listeners: {select: sctDpt}
		}, {
			xtype: 'kscombo',
			store: spSto,
			width:240,
			allowBlank: false
		}, {
			xtype: 'hidden',
			fieldLabel: '选课类别',
			name: 'stype',
			value: scttype
		}, {
			xtype: 'button',
			handler: queryStore,
			text: '查询',
			margin: '0 3',
			formBind: true
		}]
	});
	qryfrm.load();
	function queryStore() {
		var f = qryfrm.getForm();
		var params = f.getValues();
		var sto = grid.getStore();
		sto.removeAll();
		cnoSto.removeAll();
		sto.proxy.extraParams = params;
		sto.load();
	}
	var setSto = Ext.create('Ext.data.Store', {
		fields: ['id','term', 'courseid', 'cname', 'spno', 'grade', 'tname',  'xf', 'scted'],
		proxy: {
			type: 'ajax', url: '/student/GetPlan',
			reader: {
				type: 'json',
				root: 'data'
			}
		}
	});

	var grid = Ext.create('Edu.view.ShowGrid', {
		store: setSto,
		columns: [{
			xtype: 'rownumberer',
			header: "序号",
			width: 40
		}, {
			dataIndex:'scted',
			header: '操作',
			xtype: 'actionrendercolumn',
			dataIndex:'scted',
			width: 40,
			renderer: function (v) {
				if (!v) {
					return ['选课'];
				}
			},
			items: [{
				handler: function (grid, rowIndex, colIndex) {
					var rec = grid.getStore().getAt(rowIndex);
					grid.getSelectionModel().select(rec);
					sctcno(rec);
				}
			}]
		}, {
			dataIndex: 'scted',
			xtype: 'booleancolumn',
			header: "已选",
			trueText: '是',
			falseText: '否',
			width: 40
		}, {
			dataIndex: "courseid",
			header: "课程代码",
			width: 95
		}, {
			dataIndex: "cname",
			header: "课程名称",
			width: 240
		}, {
			dataIndex: "tname",
			header: "课程性质",
			minWidth: 60
		}, {
			dataIndex: "xf",
			header: "学分",
			width: 40
		}]
	});
	function sctcno1 () {
		var rs = grid.getSelectionModel().getSelection();
		if (rs.length > 0) {
			var sto = gdcno.getStore();
			sto.proxy.extraParams = rs[0].data;
			sto.load();
		} else {
			Ext.Msg.alert("提示信息", "请选择一条记录进行编辑。");
		}
	}
	var cnoSto = Ext.create('Ext.data.Store', {
		fields: ['term', 'courseno','grade','spno','scted', 'name','ap','xf','lot', 'courseid','stype', 'maxstu', 'sctcnt','comm'],
		proxy: {
			type: 'ajax', url: '/student/GetPlanCno',
			reader: {
				type: 'json',
				root: 'data'
			}
		},
		groupField: 'spno'
	});

	function sctSubmit () {
		var gd = this.up('grid');
		var rs = gd.getSelectionModel().getSelection();
		if (rs.length > 0) {
			rs[0].data.stype = qryfrm.getValues().stype;
			Ext.Ajax.request({
				url: "/student/SctSave" , //请求的地址
				params: rs[0].data,
				method: "POST",
				success: function (response, opts) {
					var obj = Ext.decode(response.responseText);
					if (obj.success) {
						Ext.Msg.alert("成功", obj.msg, function () {
							var jg = grid.getSelectionModel().getSelection();
							if (jg.length > 0) {
								jg[0].data.scted = 1;
								jg[0].commit();
								cnoSto.removeAll();
								gd.up('window').close();
							}
						});
					} else {
						Ext.Msg.alert("错误", obj.msg);
					}
				},
				failure: function (response, opts) {
					Ext.Msg.alert('错误', '状态:' + response.status + ': ' + response.statusText);
				}
			});
		} else {
			Ext.Msg.alert("提示", "请选择一个课号提交。");
		}
	}
	function sctSubmit_ () {
		var gd = this.up('grid');
		var rs = gd.getSelectionModel().getSelection();
		if (rs.length > 0) {
			rs[0].data.stype = qryfrm.getValues().stype;
			var task = {
				run: function () {
					Ext.Ajax.request({
						url: "/student/SctSave" , //请求的地址
						params: rs[0].data,
						method: "POST",
						success: function (response, opts) {
							var obj = Ext.decode(response.responseText);
							if (obj.success) {
								Ext.TaskManager.stop(task);
								Ext.Msg.hide();
								Ext.Msg.alert("成功", obj.msg, function () {
									var jg = grid.getSelectionModel().getSelection();
									if (jg.length > 0) {
										jg[0].data.scted = 1;
										jg[0].commit();
										cnoSto.removeAll();
										gd.up('window').close();
									}
								});
							} else if ("课程:" + rs[0].data.courseno + "选择失败，选课人数已满!" == obj.msg || col.overflow) {
								Ext.Msg.updateProgress(Ext.TaskManager.timerId % 100 / 100);
							} else {
								Ext.TaskManager.stop(task);
								Ext.Msg.hide();
								Ext.Msg.alert("错误", obj.msg);
							}
						},
						failure: function (response, opts) {
							Ext.TaskManager.stop(task);
							Ext.Msg.hide();
							Ext.Msg.alert('错误', '状态:' + response.status + ': ' + response.statusText);
						}
					});
					Ext.Msg.show({
						title: "提示",
						msg: "点击提示框左上角停止选课。",
						icon: Ext.Msg.INFO,
						closable: true,//Ext控件好像没有办法同时显示进度框和按钮
						progress: true,
						progressText: "课号: " + rs[0].data.courseno + " 正在抢课！",
						fn: function () {
							Ext.TaskManager.stop(task);
						}
					});
				},
				interval: col.time
			};
			Ext.TaskManager.start(task);
		} else {
			Ext.Msg.alert("提示", "请选择一个课号提交。");
		}
	}
	function sctcno(rec){
		cnoSto.removeAll();
		if (rec.get('scted') == 1) {
			return Ext.Msg.alert('提示','本课程已选！');
		}
		var gdcno = Ext.create('Edu.view.ShowGrid', {
			selType: "checkboxmodel",
			selModel: { mode: "SINGLE" },
			store: cnoSto,
			tbar: [{
				xtype: 'button',
				text: '提交',
				handler: sctSubmit
			}, {
				xtype: 'button',
				text: '抢课',
				handler: sctSubmit_
			}],
			features:[{
				ftype: 'groupingsummary',
				groupHeaderTpl: Ext.create('Ext.XTemplate', '<div>{groupValue:this.formatName}共{children.length}个课号</div>', {
					formatName: function(groupValue) {
						//console.log(this.getGroupId("spno"));
						return sctDropDown(groupValue, spSto, 'spno', 'spname');
						//console.log(sctDropDown(groupValue, spSto, 'spno', 'spname'));
						//return groupValue == rec.data.spno ? "当前专业" : "其它专业";
					}
				})
			}],
			columns: [{
				header: "序号",
				xtype: 'rownumberer',
				width: 30
			}, {
				dataIndex: "spno",
				header: "专业",
				width: 94,
				renderer: function(v) {
					return sctDropDown(v, spSto, 'spno', 'spname');
				}
			}, {
				dataIndex: "courseno",
				header: "课程序号",
				width: 70
			}, {
				dataIndex: "maxstu",
				header: "容量",
				width: 35
			}, {
				dataIndex: "sctcnt",
				header: "已选",
				width: 35
			}, {
				dataIndex: 'lot',
				header: "抽签",
				width: 35,
				xtype: 'booleancolumn',
				trueText: '是',
				falseText: '否'
			}, {
				dataIndex: "grade",
				header: "年级",
				width: 45
			}, {
				dataIndex: "xf",
				header: "学分",
				width: 40
			}, {
				dataIndex: "name",
				header: "教师",
				width: 80
			}, {
				dataIndex: "ap",
				header: "上课安排",
				width: 94,
				flex:1
			}]
		});
		var sto = gdcno.getStore();
		// FIXME: 优化显示
		if (col.allcourseno) {
			var allCnoSto = Ext.create('Ext.data.Store', {
				fields: ['term', 'courseno','grade','spno','scted', 'name','ap','xf','lot', 'courseid','stype', 'maxstu', 'sctcnt','comm'],
				proxy: {
					type: 'ajax', url: '/student/GetPlanCno',
					reader: {
						type: 'json',
						root: 'data'
					}
				},
				groupField: 'spno',
				listeners: {
					load: function(st, rds, opts) {
						sto.loadData(allCnoSto.data.items, true);
					}
				}
			});
			Ext.Ajax.request({
				url: '/Query/GetCoursePlan',
				params: {
					courseid: rec.get("courseid"),
					term: rec.get("term")
				},
				async: false,
				success: function (resp, opts) {
					var plans = Ext.decode(resp.responseText).data;
					plans.forEach( function (p) {
						allCnoSto.proxy.extraParams.id = p.pid;
						allCnoSto.load();
					});
				}
			});
		} else {
			sto.proxy.extraParams = rec.data;
			sto.load();
		}
		var win = Ext.create('Ext.window.Window', {
			title: rec.data.cname + '(' + rec.data.courseid + ')',
			modal: true, height: '80%', width: '80%', layout: 'fit',
			items: [gdcno]
		});
		win.show();
	}
	var pan = Ext.create('Edu.view.ShowPanel', {
		id: "SctPan",
		title: '学生' + scttype + '选课【插件模式】',
		items: [{
			region: 'north',
			layout: 'fit',
			items: [qryfrm]
		},{
			region: 'center',
			layout: 'fit',
			flex: 3,
			items: [grid]
		}]
	});
	var tab = Ext.getCmp(module);
	tab.add(pan);
	//防止炸裂
	tab.addListener("destroy", function () {
		if (pan != null) {
			console.log("Boom!");
		}
	});

	//隐藏多余的旧模块
	if (col.old_hide) {
		tab.addListener("add", function () {
			this.items.items[1].hide();
		});
	}
}

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