// ==UserScript==
// @name         Interface Optimization
// @namespace    https://github.com/cssxsh/Guet_SctCoz_Plug-ins
// @version      0.3.0.0
// @description  对选课系统做一些优化
// @author       cssxsh
// @include      http://bkjw.guet.edu.cn/Login/MainDesktop
// @include      http://172.16.13.22/Login/MainDesktop
// @updateURL    https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Update/Interface_Optimization.js
// @installURL   https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Update/Interface_Optimization.js
// @downloadURL  https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Update/Interface_Optimization.js
// @suppertURL   https://github.com/cssxsh/Guet_SctCoz_Plug-ins/issues
// @license      MIT
// @run-at       document-end
// @connect      raw.githubusercontent.com
// @grant        GM_xmlhttpRequest
// @grant		 GM_deleteValue
// @grant		 GM_listValues
// @grant		 GM_addValueChangeListener
// @grant		 GM_removeValueChangeListener
// @grant		 GM_setValue
// @grant		 GM_getValue
// ==/UserScript==

"use strict";

// 启动接口
Ext.onReady(function () {
	// 一些参数
	let col = {
		ver: "0.3",			//主要版本号
		stid_hide: false,	//学号参数是否隐藏
		sct_hide: false,	//已选控制是否隐藏
	};
	// 创建工具
	let plugTools = SctCoz.tools;
	if (!plugTools.inited) plugTools.init({ debugLevel: 0 });
	
	// 创建并应用修改
	var CourseSetNew = {
		action: "QryCourseSet",
		text: "课程设置",
		id: "QryCourseSet",
		listeners: {
			add: function (me, opt) {//这里用add方法不是很好，但是找不到合适的事件等待加载完毕
				//修正面板功能
				var qryfrm = me.down("fieldset"); //获取条件筛选面板
				if (!col.stid_hide) qryfrm.add({ width: 120, labelWidth: 35,  name: "stid", fieldLabel: "其他" });
				qryfrm.items.items.forEach(function (item) { item.editable = true; });
				//重写Grid
				var ctb = Ext.create("Edu.view.coursetable");
				var newFields = [{ name: "sct", type: "boolean", defaultValue: true }, "dptname", "spname", "grade", "cname", "courseno", "name", "startweek", "endweek", "oddweek", "croomno", "week", "sequence", "term","courseid","coment","studentcount","credithour","teachperiod","labperiod","copperiod","maxperson"];
				var newStore = Ext.create("Ext.data.Store", { 
					pageSize: 500,
					fields: newFields,
					proxy: {
						type: "ajax", url: "/Query/GetCourseTable",
						reader: { type: "json", root: "data"}
					}, 
					autoLoad: false
				});
				//newStore.fields = newFields;

				var newGrid = Ext.create("Ext.grid.Panel", {
					columnLines: true,
					width: "100%", height: "100%", minHeight: 400, layout: "fit",
					plugins: [Ext.create("Ext.grid.plugin.CellEditing", { clicksToEdit: 1 })],
					viewConfig: { forceFit: true, stripeRows: true , enableTextSelection: true},
					store: newStore,
					columns: [
						{ header: "序号", xtype: "rownumberer", width: 40 , sortable: false},
						{ header: "选中", dataIndex: "sct", width: 40, xtype: "checkcolumn", hidden: col.sct_hide, editor: { xtype: "checkbox" }, listeners: {
							// XXX: 在这里加一个同步事件, 但是貌似课号很多的时候对性能影响很大
							checkchange: function (me, index, checked) {
								var sto = me.up("grid").getStore();
								var courseno = sto.getAt(index).get("courseno");
								sto.each( function (record) { if (record.get("courseno") == courseno) {
									record.set("sct", checked);
								}});
							}
						}},
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
						{ xtype: "button", text: "打印", formBind: true, iconCls: "print", handler: printGrid },
						{ xtype: "button", text: "导出Excel", formBind: true, iconCls: "excel", handler: expandGrid },
						{ xtype: "button", text: "转为课表", formBind: true, icon: "/images/0775.gif", handler: openTimeTable}
					]
				});
				function printGrid (me, opt) {
					var grid = me.up("grid");
					Ext.ux.grid.Printer.mainTitle = grid.getStore().getProxy().extraParams.term + "课程设置";
					Ext.ux.grid.Printer.print(grid);
				}
				function expandGrid (me, opt) {
					var grid = me.up("grid");
					Ext.ux.grid.Printer.mainTitle = grid.getStore().getProxy().extraParams.term + "课程设置";
					Ext.ux.grid.Printer.ToExcel(grid);
				}
				function openTimeTable (me, opt) {
					var grid = me.up("grid");
					var gRec = grid.getStore().data.items.filter(function (item) { return item.data.sct; });
					var panView = Ext.create("Ext.panel.Panel", { layout: "fit", autoScroll: true, frame: true });
					Ext.create("Ext.window.Window", {
						title: "课程表", width: "80%", height:"80%", modal: true, resizable: false, layout: "fit",
						items: [panView]
					}).show()
					
					if (ctb.store.data.length == 0) {
						ctb.store.loadData([
							{"term": "2018-2019_2", "nodeno": "1", "nodename": "<font size=1>上午第一节</font></br>", "memo": "08:25-10:00", "xq1": "", "xq2": "", "xq3": "", "xq4": "", "xq5": "", "xq5": "", "xq6": "", "xq7": ""},
							{"term": "2018-2019_2", "nodeno": "2", "nodename": "<font size=1>上午第二节</font></br>", "memo": "10:25-12:00", "xq1": "", "xq2": "", "xq3": "", "xq4": "", "xq5": "", "xq5": "", "xq6": "", "xq7": ""},
							{"term": "2018-2019_2", "nodeno": "3", "nodename": "<font size=1>下午第一节</font></br>", "memo": "14:30-16:05", "xq1": "", "xq2": "", "xq3": "", "xq4": "", "xq5": "", "xq5": "", "xq6": "", "xq7": ""},
							{"term": "2018-2019_2", "nodeno": "4", "nodename": "<font size=1>下午第二节</font></br>", "memo": "16:30-18:05", "xq1": "", "xq2": "", "xq3": "", "xq4": "", "xq5": "", "xq5": "", "xq6": "", "xq7": ""},
							{"term": "2018-2019_2", "nodeno": "5", "nodename": "<font size=1>晚上第一节</font></br>", "memo": "19:00-20:35", "xq1": "", "xq2": "", "xq3": "", "xq4": "", "xq5": "", "xq5": "", "xq6": "", "xq7": ""},
							{"term": "2018-2019_2", "nodeno": "6", "nodename": "<font size=1>晚上第二节</font></br>", "memo": "21:00-22:35", "xq1": "", "xq2": "", "xq3": "", "xq4": "", "xq5": "", "xq5": "", "xq6": "", "xq7": ""}
						], true);
					}
					ctb.render(panView.body, gRec);
				}
				function queryStore() {
					var form = me.down("fieldset").up("panel").getForm();
					var params = form.getValues();
					var sto = newGrid.getStore();
					// XXX: 或许应该看一下正则表达式
					var text;
					var wk;
					var reg1 = /^[0-9]*\.\.[0-9]*$/;
					var reg2 = /^[0-9]*-[0-9]*$/;

					text = form.findField("startweek").getValue();
					if (reg1.test(text)) {
						[params.startweek, params.endweek] = getSplitArray(text, "..");
					} else if (reg2.test(text)) {
						[params.startweek, params.endweek] = getSplitArray(text, "-");
					}

					text = form.findField("fromweek").getValue();
					if (reg1.test(text)) {
						[params.fromweek, params.toweek] = getSplitArray(text, "..");
					} else if (reg2.test(text)) {
						[params.fromweek, params.toweek] = getSplitArray(text, "-");
					}

					text = form.findField("startsequence").getValue();
					if (reg1.test(text)) {
						[params.startsequence, params.endsequence] = getSplitArray(text, "..");
					} else if (reg2.test(text)) {
						[params.startsequence, params.endsequence] = getSplitArray(text, "-");
					}

					sto.proxy.extraParams = params;
					
					sto.load();
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
				// -TODO: 为columns添加checkcolumn， 不过看样子要之接重写Grid
				var p = Ext.create("Ext.grid.plugin.CellEditing", { clicksToEdit: 1 });
				grid.headerCt.insert(1, Ext.create("Ext.grid.column.Column", { header: "有效", dataIndex: "enabled", xtype: "checkcolumn", editor: { xtype: "checkbox", inputValue: 1 } }));

				//grid.headerCt.addPlugin(p);
				//添加日程表功能
				var ctb = Ext.create("Edu.view.coursetable");
				var toolTbar = grid.down("toolbar");// 获取工具栏
				toolTbar.add({ xtype: "button", text: "转为课表", formBind: true, icon: "/images/0775.gif", handler: openTimeTable});
				function openTimeTable (me, opt) {
					var grid = me.up("grid");
					var gRec = grid.getStore().data.items;
					var panView = Ext.create("Ext.panel.Panel", {layout: "fit", autoScroll: true, frame: true});
					Ext.create("Ext.window.Window", {
						title: "课程表",
						width: "80%", height:"80%",modal: true, resizable: false, layout: "fit",
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
				grid.headerCt.insert(5, Ext.create("Ext.grid.column.Column", { header: "考核成绩", dataIndex: "khcj", minWidth: 30 }));
				grid.headerCt.insert(5, Ext.create("Ext.grid.column.Column", { header: "期中成绩", dataIndex: "qzcj", minWidth: 30 , hidden: true}));
				grid.headerCt.insert(5, Ext.create("Ext.grid.column.Column", { header: "平时成绩", dataIndex: "pscj", minWidth: 30 }));
				grid.headerCt.insert(5, Ext.create("Ext.grid.column.Column", { header: "实验成绩", dataIndex: "sycj", minWidth: 30 , hidden: true}));
				var gridView = grid.getView();
				gridView.enableTextSelection = true;
			}
		}
	};
	plugTools.menuChange(CourseSetNew);
	plugTools.menuChange(StuScoreNew);
	plugTools.ClassStorage.Save("value", col, "I_O_Col");
	// FIXME: 首页的情况比较特殊这里特殊处理
	Ext.getCmp("First").close();
	Ext.getCmp("content_panel").add({
		id: "First",
		title: "首页", 
		layout: "fit",
		closable: false, 
		autoDestroy: true,
		listeners: {
			afterrender: function () {
				Ext.QuickTips.init();
				Ext.form.Field.prototype.MsgTarget = "side";
				
				// XXX: 重写加载新信息的方式
				var gdSto = Ext.create("Edu.store.NewsInfo", {
					autoLoad: true, 
					listeners: {
						"load": function (me, data) {
							grid.setVisible(data.length > 0);
							let rec = me.findRecord("openshow", 1);
							if (rec) showMsg(rec.data);
							// TODO: 尝试在这里添加一下获取新信息
							plugTools.LoadData({
								path: "NewInfo.json",
								success: function (response) {
									// plugTools.Logger(response, 0);
									let data = Ext.isArray(response.data) ? response.data : [response.data];
									me.loadData(data, true);
								},
								failure: function (result) {
									plugTools.LoadData(result, 2);
								}
							});
							
							// XXX: 添加一下必要的须知
							me.loadData([{ 
								"id": "info-0",
								"title": "插件用户须知",
								"content": 
									"当前优化插件版本为：" + col.ver + "\n\n" +
									"当前插件仍处于未完成的测试阶段。\n" +
									"如果插件有问题或者对插件有什么建议或意见请到以下链接反馈：\n" +
									"<a href='https://github.com/cssxsh/Guet_SctCoz_Plug-ins/issues' target='_blank'>https://github.com/cssxsh/Guet_SctCoz_Plug-ins/issues</a>"
								, 
								"postdate": null,
								"operator": "插件",
								"ntype": null,
								"reader": function (me) {
									Ext.create("Ext.window.Window", {
										title: me.title, width: "40%", height:"40%", modal: true, resizable: true, layout: "fit",
										// items: [{ xtype: "form", autoScroll: true, frame: true, padding: "1", html: this.content.replace(/\n/g, "<br/>") }]
										items: [{xtype: "form", autoScroll: true, frame: true, padding: "1", html: me.content.replace(/\n/g, "<br/>")}]
									}).show();
								},
								"showdate": "2019年03月05日",
								"chk": null,
								"openshow": 0,
								"isPluger": true
								}],
								true
							);
						}
					}
				});
				Ext.apply(gdSto.proxy, { url: "/comm/getusernews" });

				// XXX: 重写显示新信息的方式
				function showMsg(data) {
					let id = data.id;
					// TODO: 之后这里的判断方式要修改
					if (data.operator != "插件") {
						editfrm.load({
							url: "/comm/getnews/" + id, 
							success: function sc(a, b) {
								var rc = b.result.data;
								Ext.create("Ext.window.Window", {
									title: rc.title, width: "70%", height:"70%", modal: true, resizable: true, layout: "fit",
									items: [{ xtype: "form", autoScroll: true, frame: true, padding: "1", html: rc.content.replace(/\n/g, "<br/>") }]
								}).show();
							}
						})
					} else {
						switch (typeof data.reader) {
							case "function":
								data.reader(data);
							break;
							case "string":
								plugTools.Logger(data.reader, 0);
								plugTools.Logger("function reader (me) { Ext.create('Ext.window.Window', { title: me.title, width: '40%', height:'40%', modal: true, resizable: true, layout: 'fit', items: [{xtype: 'form', autoScroll: true, frame: true, padding: '1', html: me.content.replace(/\\n/g, '<br/>')}] }).show(); }", 0);
								eval(this.reader);
								//eval("function reader(me) { Ext.create('Ext.window.Window', { title: me.title, width: '40%', height:'40%', modal: true, resizable: true, layout: 'fit', items: [{xtype: 'form', autoScroll: true, frame: true, padding: '1', html: me.content.replace(/\\n/g, '<br/>')}] }).show(); }");
								this.reader  = reader;
								this.reader(data);
							break;
							default :
								// TODO: 需要处理一种绘制函数不存在的情况
							break;
						}
					}
				}
				var grid = Ext.create("Edu.view.ShowGrid",{
					store: gdSto, region: "center", hidden: true, title: "公共信息",
					columns: [{
						xtype: "actioncolumn", width: 30, header: "查阅", icon: "/images/0775.gif", tooltip: "阅读",
						handler: function (grid, rowIndex, colIndex) {
							var rec = grid.getStore().getAt(rowIndex);
							showMsg(rec.data);
						}
					},
						{ header: "序号", xtype: "rownumberer", width: 40 },
						{ header: "标题", dataIndex: "title", width: 400 },
						{ header: "发布来源", dataIndex: "operator" },
						{ header: "发布日期", dataIndex: "showdate" }
					]
				});
				var editfrm = Ext.create("Ext.form.Panel", {
					bodyPadding: 5, frame: true, region: "north",
					html: "<table width='100%'><tr><td><p>尊敬的用户：</p><p>　　您好，欢迎使用桂林电子科技大学教务管理系统。</p></td></tr></table>"
				});
			
				var pan = Ext.create("Edu.view.ShowPanel", { items:[grid] });
				var tab = Ext.getCmp("First");
				tab.add(pan);
			}
		}
	});
	// FIXME: 这里没有用通用方法，所以之后可能要把这种批量处理情况加入SctCoz.tools的处理中
	let panel = Ext.getCmp("content_panel");
	panel.addListener("add", function () {
		let lastTab = panel.items.last();
		lastTab.addListener("add", function () {
			// TODO: 这里用ExtJs ComponentQuery 组件选择器 重写一下
			let grid = lastTab.down("grid");
			if (grid != null) {
				grid.columns.forEach(function (c) { c.sortable = true; });
				let gridView = grid.getView();
				gridView.enableTextSelection = true;
			}
		});
	});
});