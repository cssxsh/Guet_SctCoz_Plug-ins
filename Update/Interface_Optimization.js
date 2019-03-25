// ==UserScript==
// @name         Interface Optimization
// @namespace    https://github.com/cssxsh/Guet_SctCoz_Plug-ins
// @version      3.6.2
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
		ver: "3.5",			//主要版本号
		stid_hide: false,	//学号参数是否隐藏
		sct_hide: false,	//已选控制是否隐藏
	};
	// 创建工具
	let plugTools = SctCoz.tools;
	if (!plugTools.inited) plugTools.init({ debugLevel: 0 });
	// if (plugTools.ClassStorage.Get("value", "I_O_Col") == null) {
	// 	col = plugTools.ClassStorage.Get("value", "I_O_Col");
	// } else {
	// 	plugTools.ClassStorage.Save("value", col, "I_O_Col");
	// }

	// 创建并应用修改
	let CourseSetNew = {
		action: "QryCourseSet",
		text: "课程设置",
		id: "QryCourseSet",
		listeners: {
			add: function (me, opt) {
				//修正面板功能
				let qryfrm = me.down("fieldset"); //获取条件筛选面板
				if (!col.stid_hide) qryfrm.add({ width: 120, labelWidth: 35, name: "stid", fieldLabel: "其他" });
				let dptno = qryfrm.child("[name='dptno']");
				let spno = qryfrm.child("[name='spno']");
				qryfrm.items.items.forEach(function (item) { item.editable = true; });
				dptno.addListener("change", function (me, newValue, oldValue) {
					if (newValue == "") {
						spno.getStore().clearFilter();
					}
				});

				// 重写Grid
				var ctb = Ext.create("Edu.view.coursetable");
				let newFields = [{ name: "sct", type: "boolean", defaultValue: true }, "dptname", "spname", "grade", "cname", "courseno", "name", "startweek", "endweek", "oddweek", "croomno", "week", "sequence", "term", "courseid", "coment", "studentcount", "credithour", "teachperiod", "labperiod", "copperiod", "maxperson"];
				var newStore = Ext.create("Ext.data.Store", {
					pageSize: 500,
					fields: newFields,
					// 用课号做分组依据方便后面处理, 但这样有问题
					// groupField: "courseno",
					proxy: {
						type: "ajax", url: "/Query/GetCourseTable",
						reader: { type: "json", root: "data" }
					},
					autoLoad: false,
					listeners: {
						load: function (me, data) {
							function fail(result) {
								plugTools.Logger(result, 2, "By [Get info of courses]");
							};
							// 课号分组
							me.GroupsByNo.clear();
							me.each(function (rec) {
								let key = rec.data.courseno;
								if (me.GroupsByNo.containsKey(key)) {
									me.GroupsByNo.get(key).push(rec);
								} else {
									me.GroupsByNo.add(key, [rec]);
								}
							});
							// 获取有信息的课号列表
							let coursenoList = [];
							plugTools.LoadData({
								path: "CourseNoList.json",
								success: function (response) {
									coursenoList = Ext.isArray(response.data) ? response.data : [response.data];
									coursenoList.forEach(function (Info) {
										let key = Info.courseno;
										let group = me.GroupsByNo.get(key);
										if (group != null) {
											plugTools.LoadData({
												path: Info.path,
												success: function (response) {
													group.forEach(function (rec) { rec.set("comment", response.data.comm); });
												},
												failure: fail
											});
										}
									});
								},
								failure: fail
							});
						}
					},
					GroupsByNo: Ext.create("Ext.util.HashMap")
				});

				var newGrid = Ext.create("Ext.grid.Panel", {
					columnLines: true,
					width: "100%", height: "100%", minHeight: 400, layout: "fit",
					plugins: [Ext.create("Ext.grid.plugin.CellEditing", { clicksToEdit: 1 })],
					viewConfig: { forceFit: true, stripeRows: true, enableTextSelection: true },
					store: newStore,
					columns: [
						{ header: "序号", xtype: "rownumberer", width: 40, sortable: false },
						{
							header: "选中", dataIndex: "sct", width: 40, xtype: "checkcolumn", hidden: col.sct_hide, editor: { xtype: "checkbox" }, listeners: {
								checkchange: function (me, index, checked) {
									let sto = me.up("grid").getStore();
									let key = sto.getAt(index).get("courseno");
									let Group = sto.GroupsByNo.get(key);
									Group.forEach(function (record) { record.set("sct", checked); });
								}
							}
						},
						{ header: "年级", dataIndex: "grade", width: 50 },
						{ header: "专业", dataIndex: "spname", width: 120 },
						{ header: "课程序号", dataIndex: "courseno", width: 80 },
						{ header: "课程代码", dataIndex: "courseid", width: 94 },
						{ header: "课程名称", dataIndex: "cname", minWidth: 180, flex: 1 },
						{ header: "星期", dataIndex: "week", width: 40 },
						{ header: "节次", dataIndex: "sequence", width: 40 },
						{ header: "开始周", dataIndex: "startweek", width: 40 },
						{ header: "结束周", dataIndex: "endweek", width: 40 },
						{ header: "教室", dataIndex: "croomno", width: 70 },
						{ header: "教师", dataIndex: "name", width: 70 },
						{ header: "学分", dataIndex: "credithour", width: 40 },
						{ header: "理论学时", dataIndex: "teachperiod", width: 40 },
						{ header: "实验学时", dataIndex: "labperiod", width: 40 },
						{ header: "上机学时", dataIndex: "copperiod", width: 40 },
						{ header: "可选人数", dataIndex: "maxperson", width: 40 },
						{ header: "已选人数", dataIndex: "studentcount", width: 40 },
						{ header: "备注", dataIndex: "comment", flex: 1 }
					],
					tbar: [
						{ xtype: "button", text: "打印", formBind: true, iconCls: "print", handler: printGrid },
						{ xtype: "button", text: "导出Excel", formBind: true, iconCls: "excel", handler: expandGrid },
						{ xtype: "button", text: "转为课表", formBind: true, icon: "/images/0775.gif", handler: openTimeTable }
					]
				});
				function printGrid(me, opt) {
					var grid = me.up("grid");
					Ext.ux.grid.Printer.mainTitle = grid.getStore().getProxy().extraParams.term + "课程设置";
					Ext.ux.grid.Printer.print(grid);
				}
				function expandGrid(me, opt) {
					var grid = me.up("grid");
					Ext.ux.grid.Printer.mainTitle = grid.getStore().getProxy().extraParams.term + "课程设置";
					Ext.ux.grid.Printer.ToExcel(grid);
				}
				function openTimeTable(me, opt) {
					var grid = me.up("grid");
					var gRec = grid.getStore().data.items.filter(function (item) { return item.data.sct; });
					var panView = Ext.create("Ext.panel.Panel", { layout: "fit", autoScroll: true, frame: true });
					Ext.create("Ext.window.Window", {
						title: "课程表", width: "80%", height: "80%", modal: true, resizable: false, layout: "fit",
						items: [panView]
					}).show()
					// 如果没有数据本地加载
					if (ctb.store.data.length == 0) {
						ctb.store.loadData([
							{ "term": "2018-2019_2", "nodeno": "1", "nodename": "<font size=1>上午第一节</font></br>", "memo": "08:25-10:00", "xq1": "", "xq2": "", "xq3": "", "xq4": "", "xq5": "", "xq5": "", "xq6": "", "xq7": "" },
							{ "term": "2018-2019_2", "nodeno": "2", "nodename": "<font size=1>上午第二节</font></br>", "memo": "10:25-12:00", "xq1": "", "xq2": "", "xq3": "", "xq4": "", "xq5": "", "xq5": "", "xq6": "", "xq7": "" },
							{ "term": "2018-2019_2", "nodeno": "3", "nodename": "<font size=1>下午第一节</font></br>", "memo": "14:30-16:05", "xq1": "", "xq2": "", "xq3": "", "xq4": "", "xq5": "", "xq5": "", "xq6": "", "xq7": "" },
							{ "term": "2018-2019_2", "nodeno": "4", "nodename": "<font size=1>下午第二节</font></br>", "memo": "16:30-18:05", "xq1": "", "xq2": "", "xq3": "", "xq4": "", "xq5": "", "xq5": "", "xq6": "", "xq7": "" },
							{ "term": "2018-2019_2", "nodeno": "5", "nodename": "<font size=1>晚上第一节</font></br>", "memo": "19:00-20:35", "xq1": "", "xq2": "", "xq3": "", "xq4": "", "xq5": "", "xq5": "", "xq6": "", "xq7": "" },
							{ "term": "2018-2019_2", "nodeno": "6", "nodename": "<font size=1>晚上第二节</font></br>", "memo": "21:00-22:35", "xq1": "", "xq2": "", "xq3": "", "xq4": "", "xq5": "", "xq5": "", "xq6": "", "xq7": "" }
						], true);
					}
					ctb.render(panView.body, gRec);
				}
				function queryStore() {
					let params = qryfrm.up("panel").getForm().getValues();
					let sto = newGrid.getStore();
					// 或许应该看一下正则表达式
					function Split(a, b) {
						let text = params[a].toString();
						let reg = /(^[0-9]*)|([0-9]*$)/g;
						[params[a], params[b]] = text.match(reg);
					};
					Split("startweek", "endweek");
					Split("fromweek", "toweek");
					Split("startsequence", "endsequence");
					params.tname = params.tname.trim();
					params.courseno = params.courseno.trim();
					params.courseid = params.courseid.trim();
					params.cname = params.cname.trim();

					sto.proxy.extraParams = params;
					sto.load();
				}
				let oldGrid = me.down("grid");
				let panel = oldGrid.up("panel");
				let queryButton = me.down("fieldset").down("button");
				queryButton.handler = queryStore;
				panel.remove(oldGrid);
				panel.add(newGrid);
			}
		},
		isAutoLoad: true
	};
	let StuScoreNew = {
		action: "StuScore",
		text: "成绩查询",
		id: "StuScore",
		listeners: {
			add: function (me, opt) {
				// 修正Grid功能
				let grid = me.down("grid");
				grid.columns.forEach(function (c) { c.sortable = true; });
				grid.columns[3].width = 60;
				grid.columns[4].minWidth = 120;
				grid.columns[4].width = 120;
				grid.headerCt.insert(5, Ext.create("Ext.grid.column.Column", { header: "考核成绩", dataIndex: "khcj", minWidth: 30 }));
				grid.headerCt.insert(5, Ext.create("Ext.grid.column.Column", { header: "期中成绩", dataIndex: "qzcj", minWidth: 30, hidden: true }));
				grid.headerCt.insert(5, Ext.create("Ext.grid.column.Column", { header: "平时成绩", dataIndex: "pscj", minWidth: 30 }));
				grid.headerCt.insert(5, Ext.create("Ext.grid.column.Column", { header: "实验成绩", dataIndex: "sycj", minWidth: 30, hidden: true }));
				grid.getView().enableTextSelection = true;
			}
		},
		isAutoLoad: true
	};
	let SutSctedNew = {
		action: "StuScted",
		text: "已选课程",
		id: "StuScted",
		listeners: {
			add: function (me, opt) {
				// 修改 Grid
				let grid = me.down("showgrid");
				let sto = grid.getStore();
				grid.columns[3].width = 75;
				grid.columns[4].maxWidth = 240;
				grid.getStore().model.setFields(["teacherno", "teacher", "xf", "classno", "spno", "spname", "tname", "tname1", "grade", "cname", "pycc", "dptno", "xm", "stid", "name", "term", "courseid", "courseno", "stype", "khsj", "state", "xksj", "ip", "comm", "checked", "pscj", "khzt", "cjf", "setjc", "textnum"]);
				grid.headerCt.insert(4, Ext.create("Ext.grid.column.Column", { header: "教师", dataIndex: "teacher", width: 100 }));
				grid.headerCt.insert(4, Ext.create("Ext.grid.column.Column", { header: "教师号", dataIndex: "teacherno", width: 100, hidden: true }));

				// 修改 fieldset
				let field = me.down("fieldset");
				let form = me.down("queryform").getForm();
				let Label = [
					{ name: "TotalCredits", fieldLabel: "总计学分", width: 100, labelWidth: 60, editable: false, value: "???" },
					{ name: "CompulsoryCredit", fieldLabel: "必修学分", width: 100, labelWidth: 60, editable: false, value: "???" },
					{ name: "ElectiveCredits", fieldLabel: "选修学分", width: 100, labelWidth: 60, editable: false, value: "???" },
					{ name: "GeneralCredits", fieldLabel: "通识学分", width: 100, labelWidth: 60, editable: false, value: "???" },
					{ name: "CourseFee", fieldLabel: "选课费", width: 120, labelWidth: 60, editable: false, value: "???" }
				];
				field.add(Label);
				field.down("button").handler = function (me, opt) {
					sto.proxy.extraParams = { term: form.getValues().term, comm: form.getValues().comm };
					sto.load();
				}

				// 添加新信息
				grid.getStore().addListener("load", function (me, opt) {
					let Total = 0;
					let Compulsory = 0;
					let Elective = 0;
					let General = 0;
					let CourseFee = 0;
					let data;

					// 获取教师信息
					Ext.Ajax.request({
						url: "/student/getstutable",
						method: "GET",
						dataType: "json",
						async: false,
						params: { term: form.getValues().term },
						success: function (response, opts) { data = Ext.Array.clone(Ext.decode(response.responseText).data); },
						failure: function (response, opts) { plugTools.Logger(response, 2, "By [Get info of teachers]"); }
					});

					sto.each(function (rec) {
						// 计算学分, 选课费
						let Credit = parseFloat(rec.data.xf)
						let item = { name: "佚名", teacherno: "?" };
						Total += Credit;
						let c = [rec.data.courseid.charAt(0), rec.data.courseid.charAt(1)];
						switch (c[0]) {
							case "B":
								Compulsory += Credit;
								CourseFee += Credit * (c[1] == "G" ? 80 : 120);
								break;
							case "X":
							case "R":
								Elective += Credit;
								CourseFee += Credit * 120;
								break;
							case "T":
								General += Credit;
								CourseFee += Credit * 80;
								break;
							default:
								//
								break;
						}

						data.forEach(function (i, index) {
							if (i.courseno == rec.data.courseno) {
								item.name = i.name.toString();
								item.courseno = i.courseno.toString();
								data.splice(index, 1);
							}
						});
						rec.set("teacher", item.name);
						rec.set("teacherno", item.teacherno);
						return true;
					});
					// 处理单元格左上角小红标, 即提交更改
					sto.commitChanges();
					form.findField("TotalCredits").setValue(Total);
					form.findField("CompulsoryCredit").setValue(Compulsory);
					form.findField("ElectiveCredits").setValue(Elective);
					form.findField("GeneralCredits").setValue(General);
					form.findField("CourseFee").setValue(CourseFee);
				});
			}
		},
		isAutoLoad: true
	};
	let StuPlanNew = {
		action: "StuPlan",
		text: "已选课程",
		id: "StuPlan",
		listeners: {
			afterrender: function (me, opt) {
				// 创建新的qryfrm
				let dptSto = Ext.data.StoreManager.lookup("dptSto");
				let tmSto = Ext.data.StoreManager.lookup("xqSto");
				let spSto = Ext.data.StoreManager.lookup("spSto");
				let tpAry = [[0, '百分制'], [1, '五级制'], [2, '二级制']];
				let sctDptListeners = {
					select: function (cmb, rec) {
						let dpt = rec[0].get("dptno");
						spSto.clearFilter();
						spSto.filter("dptno", new RegExp("^" + dpt + "$"));
						qryfrmNew.getForm().findField("spno").setValue("");
					},
					change: function (me, newValue, oldValue) {
						if (oldValue == null) {
							spSto.filter("dptno", new RegExp("^" + newValue + "$"));
						}
					}
				};
				function queryStore() {
					let sto = me.down("grid").getStore();
					sto.proxy.extraParams = qryfrmNew.getForm().getValues();
					sto.load();
				}
				var qryfrmNew = Ext.create("Edu.view.QueryForm", {
					url: "/student/StuInfo",
					labelWidth: 60,
					region: "north",
					argcols: [
						{ xtype: "termcombo", store: tmSto, allowBlank: false, labelWidth: 30, value: getTerm()[1] },
						{ xtype: "gradecombo", labelWidth: 30, width: 120, allowBlank: false, size: 6 },
						{ xtype: "dptcombo", store: dptSto, listeners: sctDptListeners },
						{ xtype: "kscombo", store: spSto, width: 240, allowBlank: false },
						{ xtype: "combo", store: [[0, "执行计划"], [1, "培养计划"]], name: "plan", fieldLabel: "计划选择", queryMode: "local", value: 0, editable: false, blankText: "请选择学院" },
						{ xtype: "button", text: "查询", margin: "0 3", handler: queryStore }
					]
				});
				qryfrmNew.load()

				// 创建新grid
				let sto = Ext.create("Ext.data.Store", {
					fields: ["term", "spno", "grade", "courseid", "cname", "tname", "examt", "xf", "llxs", "syxs", "qtxs", "sjxs", "type", "mustsct", "xjcl", "comm"],
					proxy: {
						url: "/Query/GetCoursePlan",
						type: "ajax",
						reader: {
							type: "json",
							root: "data"
						}
					}
				});
				var gridNew = Ext.create("Edu.view.ShowGrid", {
					region: "center",
					store: sto,
					columns: [
						{ header: "序号", xtype: "rownumberer", width: 35 },
						{ header: "学期", dataIndex: "term", width: 120, renderer: function (v) { return sctDropDown(v, tmSto, "term", "termname") } },
						{ header: "专业", dataIndex: "spno", width: 160, renderer: function (v) { return sctDropDown(v, spSto, "spno", "spname") } },
						{ header: "年级", dataIndex: "grade", width: 40 },
						{ header: "课程代号", dataIndex: "courseid", width: 90 },
						{ header: "课程名称", dataIndex: "cname", minWidth: 160 },
						{ header: "课程性质", dataIndex: "tname", width: 100 },
						{ header: "考核<br/>方式", dataIndex: "examt", width: 40 },
						{ header: "学分", dataIndex: "xf", width: 40 },
						{ header: "理论<br/>学时", dataIndex: "llxs", width: 40 },
						{ header: "实验<br/>学时", dataIndex: "syxs", width: 40 },
						{ header: "上机<br/>学时", dataIndex: "qtxs", width: 40 },
						{ header: "实践<br/>学时", dataIndex: "sjxs", width: 40 },
						{ header: "成绩类型", dataIndex: "type", width: 80, renderer: function (v) { return tpAry[v][1]; } },
						{ header: "应选课", dataIndex: "mustsct", xtype: "checkcolumn", width: 60 },
						{ header: "学籍<br/>处理", dataIndex: "xjcl", xtype: "checkcolumn", width: 40 },
						{ header: "备注", dataIndex: "comm", width: 60, flex: .6 }
					],
					tbar: [
						{ xtype: "button", text: "打印", formBind: true, iconCls: "print", handler: printGrid },
						{ xtype: "button", text: "导出Excel", formBind: true, iconCls: "excel", handler: expandGrid }
					]
				});
				function printGrid(me, opt) {
					var grid = me.up("grid");
					Ext.ux.grid.Printer.mainTitle = grid.getStore().getProxy().extraParams.term + "课程设置";
					Ext.ux.grid.Printer.print(grid);
				}
				function expandGrid(me, opt) {
					var grid = me.up("grid");
					Ext.ux.grid.Printer.mainTitle = grid.getStore().getProxy().extraParams.term + "课程设置";
					Ext.ux.grid.Printer.ToExcel(grid);
				}

				let panNew = Ext.create("Edu.view.ShowPanel", {
					title: "<font size=4>课程计划</font>",
					items: [qryfrmNew, gridNew]
				});
				// 加载组件
				me.add(panNew);
			}
		},
		isAutoLoad: false
	};
	plugTools.menuChange(CourseSetNew);
	plugTools.menuChange(StuScoreNew);
	plugTools.menuChange(SutSctedNew);
	plugTools.menuChange(StuPlanNew);

	let panel = Ext.getCmp("content_panel");
	panel.addListener("add", function (me, lastTab, opt) {
		lastTab.addListener("add", function (me, opt) {
			let grids = me.query("grid,showgrid");
			grids.forEach(function (item) {
				item.columns.forEach(function (c) { c.sortable = true; });
				let gridView = item.getView();
				gridView.enableTextSelection = true;
			});
		});
	});
	Ext.getCmp("First").close();
	panel.add({
		id: "First",
		title: "首页",
		layout: "fit",
		closable: false,
		autoDestroy: true,
		listeners: {
			afterrender: function (me, opt) {
				Ext.QuickTips.init();
				Ext.form.Field.prototype.MsgTarget = "side";

				let gdSto = Ext.create("Edu.store.NewsInfo", {
					autoLoad: true,
					// 添加了一个新的属性isPluger
					fields: ["id", "title", "content", "postdate", "operator", "ntype", "reader", "showdate", "chk", "openshow", "isPluger"],
					listeners: {
						"load": function (me, data) {
							grid.setVisible(data.length > 0);
							let rec = me.findRecord("openshow", 1);
							if (rec) showMsg(rec.data);
							plugTools.LoadData({
								path: "NewInfo.json",
								success: function (response) {
									let data = Ext.isArray(response.data) ? response.data : [response.data];
									me.loadData(data, true);
								},
								failure: function (result) {
									plugTools.Logger(result, 2, "By [Get NewInfo]");
								}
							});

							me.loadData(
								[{
									id: "info-0",
									title: "插件用户须知",
									content:
										"当前优化插件版本为：" + col.ver + "<br/><br/>" +
										"当前插件仍处于未完成的测试阶段。<br/>" +
										"如果插件有问题或者对插件有什么建议或意见请到以下链接反馈或发送邮件到以下邮箱：<br/>" +
										"<a href='https://github.com/cssxsh/Guet_SctCoz_Plug-ins/issues' target='_blank'>https://github.com/cssxsh/Guet_SctCoz_Plug-ins/issues</a><br/>" + 
										"<a href='mailto:cssxsh@gmail.com' target='_blank'>cssxsh@gmail.com</a><br/>"
									,
									postdate: null,
									operator: "插件",
									ntype: null,
									reader: function (me) {
										Ext.create("Ext.window.Window", {
											title: me.title, width: "40%", height: "40%", modal: true, resizable: true, layout: "fit",
											items: [{ xtype: "form", autoScroll: true, frame: true, padding: "1", html: me.content.replace(/\n/g, "<br/>") }]
										}).show();
									},
									showdate: "2019年03月25日",
									chk: null,
									openshow: 0,
									isPluger: true
								}],
								true
							);
						}
					}
				});
				Ext.apply(gdSto.proxy, { url: "/comm/getusernews" });

				function showMsg(data) {
					function showdata(data) {
						Ext.create("Ext.window.Window", {
							title: data.title, width: "70%", height: "70%", modal: true, resizable: true, layout: "fit",
							items: [{ xtype: "form", autoScroll: true, frame: true, padding: "1", html: data.content.replace(/\n/g, "<br/>") }]
						}).show();
					};
					let id = data.id;
					if (!data.isPluger) {
						editfrm.load({
							url: "/comm/getnews/" + id,
							success: function sc(a, b) {
								showdata(b.result.data)
							}
						})
					} else {
						switch (typeof data.reader) {
							case "function":
								data.reader(data);
								break;
							case "string":
								// 将字符串解析为函数,这里要封到一个字符串里执行
								eval("data.reader = " + data.reader, this);
								data.reader(data);
								break;
							default:
								showdata(data)
								break;
						}
					}
				};
				var grid = Ext.create("Edu.view.ShowGrid", {
					store: gdSto, region: "center", hidden: true, title: "公共信息",
					columns: [
						{ header: "查阅", xtype: "actioncolumn", width: 30, icon: "/images/0775.gif", tooltip: "阅读", handler: function (grid, rowIndex, colIndex) { var rec = grid.getStore().getAt(rowIndex); showMsg(rec.data); } },
						{ header: "序号", xtype: "rownumberer", width: 40 },
						{ header: "标题", dataIndex: "title", width: 400 },
						{ header: "发布来源", dataIndex: "operator" },
						{ header: "发布日期", dataIndex: "showdate", width: 120 }
					]
				});
				let editfrm = Ext.create("Ext.form.Panel", {
					bodyPadding: 5, frame: true, region: "north",
					html: "<table width='100%'><tr><td><p>尊敬的用户：</p><p>　　您好，欢迎使用桂林电子科技大学教务管理系统。</p></td></tr></table>"
				});

				let pan = Ext.create("Edu.view.ShowPanel", { items: [grid] });
				me.add(pan);
			}
		}
	});
});

if (typeof SctCoz == "undefined") {//防止重复定义
	Ext.define("SctCoz.tools", {
		config: {
			id: "plug",
		},
		statics: {
			version: "3.5.4",
			inited: false,
			debugLevel: 2,
			SysMenus: null,
			Menus_Tree: null,

			ClassStorage: {
				//变量数组
				NewMenus: [],
				NewMenusIdList: [],

				//操作方法
				Save: function (type, value, id) {
					if (type == "menu") {
						this.NewMenus.push(value);
						this.NewMenusIdList.push(value.id);
					} else if (type == "value") {
						GM_setValue(id, value);
					}
				},
				Get: function (type, id) {
					let value = null;
					if (type == "menu") {
						value = this.NewMenus.find(function (item) { return item.id == id });
					} else if (type == "value") {
						value = GM_getValue(id);
					}
					return value;
				},
				Set: function (type, id, setdata) {
					if (type == "menu") {
						//处理符合的菜单
						this.NewMenus.filter(function (item) { return item.id == id }).forEach(setdata);
					} else if (type == "value") {
						setdata(GM_getValue(id));
					}
				},
				Delete: function (type, id) {
					if (type == "menu") {
						//处理符合的菜单
						this.NewMenus.filter(function (item) { return item.id == id }).forEach(NewMenus.splice);
					} else if (type == "value") {
						GM_deleteValue(id);
					}
				},
				getList: function (type) {
					if (type == "menu") {
						return this.NewMenusIdList;
					} else if (type == "value") {
						return GM_listValues();
					}
				}
			},
			// 用来操作菜单的函数
			menuAdd: function (config) {
				this.Logger(config.action + " add...");
				let menu_config = {
					id: config.id,
					action: config.id,
					children: config.children,
					controller: "Pluger",
					leaf: true,
					text: config.text,
					type: "action"
				};
				this.Menus_Tree.appendChild(menu_config);
				this.ClassStorage.Save("menu", config);
			},
			menuChange: function (config) {
				this.Logger(config.action + " change...");
				this.ClassStorage.Save("menu", config);
			},
			getNewListeners: function (id) {
				let menu = this.ClassStorage.Get("menu", id);
				let Listeners = (menu == null) ? {} : menu.listeners || { activate: null };

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
			getNewSetting: function (id) {
				let menu = this.ClassStorage.Get("menu", id);
				if (menu == null) {
					return { isAutoLoad: true };
				} else {
					return menu;
				}
			},
			// 新的启动模块函数, 用来配合menuChange使用
			newOpenTab: function (URL, id, text, actid) {
				let tabPanel = Ext.getCmp("content_panel");
				let tabNodeId = tabPanel.down("#" + actid);
				let newConfig = SctCoz.tools.getNewSetting(actid);
				if (tabNodeId == null) {
					tabPanel.add({
						id: actid,
						title: newConfig.text || text,
						layout: "fit",
						closable: true,
						childActId: actid,
						barChange: false,
						loader: {
							url: URL,
							loadMask: "请稍等...",
							autoLoad: newConfig.isAutoLoad,
							scripts: true
						},
						listeners: newConfig.listeners
					}).show().addListener("activate", function (me, opts) {
						if (me.barChange) {
							me.barChange = false;
							me.loader.load();
						}
					});
				}
				else {
					tabPanel.setActiveTab(tabNodeId);
				}
			},
			init: function (config) {
				// config 参数赋值
				if (typeof config != "undefined") {
					// this.id = config.id|"plug";
					this.debugLevel = typeof config.debugLevel == "undefined" ? this.debugLevel : config.debugLevel;
				}
				// 初始化
				this.Logger("ver " + this.version + " initing...");
				this.SysMenus = Ext.getCmp("SystemMenus");
				this.Menus_Tree = this.SysMenus.down("treeview").node;
				// 重载打开Tab的方法
				this.SysMenus.openTab = this.newOpenTab;
				// 注册Store
				Ext.create("SctCoz.SpInfo", { id: "spnoSto" })
				this.inited = true;
			},
			// 写一些调试用组件
			// 调试输出
			Logger: function (info, Level, hint, way) {
				// 选择输出形式
				let prefix = "";
				let style = "";
				// 默认输出等级为1
				let level = typeof Level == "undefined" ? 1 : Level;
				// 低于debug等级不输出
				if (level < this.debugLevel && level >= 0) return;
				// 各种输出的写法有问题
				switch (level) {
					case 0:
						console.log("%o", info);
						break;		// 过程记录
					case 1:
						prefix = "@: ";
						style = "color: green;";
						console.info("%c" + prefix + info, style);
						break;		// 运行异常
					case 2:
						prefix = "$: ";
						style = "color: blue; font-size: 12px";
						console.groupCollapsed("%c" + prefix + hint, style);
						console.warn(info);
						console.groupEnd();
						break;		// 轻微警告
					case 3:
						prefix = "#: ";
						style = "color: yellow; font-size: 24px";
						console.groupCollapsed("%c" + prefix + hint, style);
						console.debug(info);
						console.groupEnd();
						break;		// 严重错误
					case 4:
						prefix = "!: ";
						style = "color: red; font-size: 48px";
						console.groupCollapsed("%c" + prefix + hint, style);
						console.error(info);
						console.groupEnd();
						break;
					case 5:		// 回滚代码
						prefix = "作者是个菜鸡！！！： ";
						style = "color: black; font-size: 96px";
						console.group("%c" + prefix + hint, style);
						console.error(info);
						console.groupEnd();
						break;
					case -1:
					default:	// 特殊处理
						prefix = "?: ",
							style = "color: green;";
						console.groupCollapsed("%c" + prefix + hint, style);
						console[way](info);
						console.groupEnd();
						break;
				}
			},
			// 修复了问题,原因是没有添加连接名单
			LoadData: function (config) {
				let isByGit = (config.isByGit == null) ? true : false;
				this.Logger(config, -1, "Plug-in data from " + (isByGit ? "extranet" : "intranet") + " loading...", "info");
				let url = (isByGit) ? ("https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Json/" + config.path) : ("http://experiment.guet.edu.cn/upfile/" + config.path.replace(/\//g, "_") + ".rar");
				GM_xmlhttpRequest({
					// GET, HEAD, POST, 默认GET
					method: config.method || "GET",
					// 数据选项， 仅在POST情况下生效
					data: config.data,
					// 默认加载path
					url: config.url || url,
					// arraybuffer, blob, json， 默认json
					responseType: config.type || "json",
					// 延迟上限， 默认3000ms
					outtime: config.timeout || 3000,
					// 加载失败的情况
					ontimeout: config.failure,
					onerror: config.failure,
					// 成功完成的情况
					onload: function (result) {
						switch (result.status) {
							case 404:
								config.failure(result);
								break;
							case 200:
							default:
								config.success(result.response);
								break;
						}
					}
				});
			}
		}
	});
	Ext.define("SctCoz.SpInfo", {
		extend: "Ext.data.Store",
		fields: ["spno", "dptno", "spname", "code", "used", { name: "text", convert: function (v, rec) { return rec.data.spno + " " + rec.data.spname; } }],
		proxy: {
			type: "ajax",
			url: "/Comm/GetSpno",
			reader: {
				type: "json",
				root: "data"
			}
		},
		autoLoad: true,
		sorters: [
			{ property: "dptno", direction: "ASC" },
			{ property: "spno", direction: "ASC" }
		]
	});
}