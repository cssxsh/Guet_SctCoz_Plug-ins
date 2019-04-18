// ==UserScript==
// @name         Interface Optimization
// @namespace    https://github.com/cssxsh/Guet_SctCoz_Plug-ins
// @version      3.7.4
// @description  对选课系统做一些优化
// @author       cssxsh
// @include      http://bkjw.guet.edu.cn/Login/MainDesktop
// @include      http://172.16.13.22/Login/MainDesktop
// @updateURL    https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate/Interface_Optimization.js
// @installURL   https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate/Interface_Optimization.js
// @downloadURL  https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate/Interface_Optimization.js
// @suppertURL   https://github.com/cssxsh/Guet_SctCoz_Plug-ins/issues
// @require      https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/Bate/tools.js
// @license      MIT
// @run-at       document-end
// @connect      raw.githubusercontent.com
// @connect      experiment.guet.edu.cn
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
				// FIXME: [8] <重写课程表格> {添加和规范化课程表格功能和格式} (教务自带的模块不够好用)
				var ctb = Ext.create("Edu.view.coursetable");
				let newFields = [{ name: "sct", type: "boolean", defaultValue: true }, "dptname", "spname", "grade", "cname", "courseno", "name", "startweek", "endweek", "oddweek", "croomno", "week", "sequence", "term", "courseid", "coment", "studentcount", "credithour", "teachperiod", "labperiod", "copperiod", "maxperson"];
				let Checkchange = function (me, index, checked) {
					let sto = me.up("grid").getStore();
					let key = sto.getAt(index).get("courseno");
					let Group = sto.GroupsByNo.get(key);
					Group.forEach(function (record) { record.set("sct", checked); });
				};
				let ShowComm = function (grid, rowIndex, colIndex) {
					let sto = grid.getStore();
					let info = sto.getAt(rowIndex).get("comment");
					plugTools.LoadData({
						path: info.path,
						success: function (response) {
							let data = response.data;
							Ext.create("Ext.window.Window", {
								title: data.title || ("课号：" + data.courseno), width: "40%", height: "40%", modal: true, resizable: true, layout: "fit",
								items: [{ xtype: "form", autoScroll: true, frame: true, padding: "1", loader: data.loader, html: data.html || data.comm }]
							}).show();
						},
						failure: function (result) {
							plugTools.Logger(result, 2, "By [Get info of courses]");
						}
					});
				};
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
							let Loading = newGrid.setLoading("加载课程信息中...");
							plugTools.LoadData({
								path: "CourseNoList.json",
								success: function (response) {
									(Ext.isArray(response.data) ? response.data : [response.data]).forEach(function (Info) {
										let key = Info.courseno;
										let group = me.GroupsByNo.get(key);
										if (group != null) {
											group.forEach(function (rec) { rec.set("comment", Info); });
										}
									});
									Loading.hide();
								},
								failure: function (result) {
									plugTools.Logger(result, 2, "By [Get info of courses]");
									Loading.hide();
								}
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
						{ header: "选中", dataIndex: "sct", width: 40, xtype: "checkcolumn", hidden: col.sct_hide, editor: { xtype: "checkbox" }, listeners: { checkchange: Checkchange } },
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
						{ header: "备注", dataIndex: "comment", xtype: "actionrendercolumn", renderer: function (v, m, r) { return r.data.comment != null ? ["查看"] : []; }, items: [{ handler: ShowComm }], flex: 1 }
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
						let p = text.match(reg);
						[params[a], params[b]] = (p.length = 1) ? ["", p[0]] : p;
						// 修复bug
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
				grid.columns[1].hidden = true;
				grid.columns[3].width = 75;
				grid.columns[4].maxWidth = 240;
				grid.getStore().model.setFields(["teacherno", "teacher", "xf", "classno", "spno", "spname", "tname", "tname1", "grade", "cname", "pycc", "dptno", "xm", "stid", "name", "term", "courseid", "courseno", "stype", "khsj", "state", "xksj", "ip", "comm", "checked", "pscj", "khzt", "cjf", "setjc", "textnum"]);
				grid.headerCt.insert(4, Ext.create("Ext.grid.column.Column", { header: "教师", dataIndex: "teacher", width: 100 }));
				grid.headerCt.insert(4, Ext.create("Ext.grid.column.Column", { header: "教师号", dataIndex: "teacherno", width: 100, hidden: true }));
				grid.headerCt.insert(9, Ext.create("Ext.grid.column.Column", { header: "选课费", dataIndex: "cost", width: 80 }));

				// 修改 fieldset
				let field = me.down("fieldset");
				let form = me.down("queryform").getForm();
				let Label = [
					{ name: "TotalCredits", fieldLabel: "总计学分", width: 100, labelWidth: 60, editable: false, value: "???" },
					{ name: "CompulsoryCredit", fieldLabel: "必修学分", width: 100, labelWidth: 60, editable: false, value: "???" },
					{ name: "ElectiveCredits", fieldLabel: "选修学分", width: 100, labelWidth: 60, editable: false, value: "???" },
					{ name: "GeneralCredits", fieldLabel: "通识学分", width: 100, labelWidth: 60, editable: false, value: "???" },
					{ name: "CourseFee", fieldLabel: "总选课费", width: 120, labelWidth: 60, editable: false, value: "???" }
				];
				field.add(Label);
				// TODO: [7] <消除学期锁定> {可以使学期为空}
				// field.query('[name=term]').forEach( function (item) {
				// 	item.allowBlank = true;
				// });
				field.down("button").handler = function (me, opt) {
					sto.proxy.extraParams = { term: form.getValues().term, comm: form.getValues().comm };
					sto.load();
				}

				// 添加新信息
				// TODO: [8] <显示单门学费> {}
				grid.getStore().addListener("load", function (me, opt) {
					let Total = 0;
					let Compulsory = 0;
					let Elective = 0;
					let General = 0;
					let CourseFee = 0;
					let data;

					// 获取教师信息
					let Loading = grid.setLoading("加载信息中...");
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
						let item = { name: "佚名", teacherno: "?" , cost: 0};
						Total += Credit;
						let c = [rec.data.courseid.charAt(0), rec.data.courseid.charAt(1)];
						switch (c[0]) {
							case "B":
								Compulsory += Credit;
								item.cost = Credit * (c[1] == "G" ? 80 : 120);
								break;
							case "X":
							case "R":
								Elective += Credit;
								item.cost = Credit * 120;
								break;
							case "T":
								General += Credit;
								item.cost = Credit * 80;
								break;
							default:
								//
								break;
						}
						item.cost *= (rec.data.stype == "重修") ? 0.7 : 1.0;
						CourseFee += item.cost;

						data.forEach(function (i, index) {
							if (i.courseno == rec.data.courseno) {
								item.name = i.name.toString();
								item.teacherno = i.teacherno.toString();
								item.courseno = i.courseno.toString();
								data.splice(index, 1);
							}
						});
						rec.set("teacher", item.name);
						rec.set("teacherno", item.teacherno);
						rec.set("cost", item.cost);
					});
					// 处理单元格左上角小红标, 即提交更改
					sto.commitChanges();
					Loading.hide();
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
				let tpAry = [[0, "百分制"], [1, "五级制"], [2, "二级制"]];
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
	// menu的对参数完整度要求比较高
	let LabSctNew = {
		action: "LabSctNew",
		children: [],
		controller: "Plug-in",
		id: "LabSctNew",
		leaf: true,
		text: "实验选课【插件】",
		type: "action",
		isAutoLoad: false,
		listeners: {
			afterrender: function (me, opt) {
				Ext.QuickTips.init();
				Ext.form.Field.prototype.MsgTarget = "side";

				let dptSto = Ext.data.StoreManager.lookup("dptSto");// Ext.create("Edu.store.departs");
				let tmSto = Ext.data.StoreManager.lookup("xqSto");
				let spSto = Ext.data.StoreManager.lookup("spSto");

				var qryfrm = Ext.create("Edu.view.QueryForm", {
					url: "/student/StuInfo",
					labelWidth: 60,
					region: "north",
					argcols: [
						{ xtype: "termcombo", store: tmSto, allowBlank: false, labelWidth: 30, readOnly: true, value: getTerm()[1] },
						{ xtype: "gradecombo", labelWidth: 30, width: 120, allowBlank: false, size: 6 },
						{ xtype: "dptcombo", store: dptSto, fieldLabel: "开课学院", editable: false, listeners: { select: sctDpt } },
						{ xtype: "kscombo", store: spSto, width: 240, allowBlank: false },
						{ xtype: "button", text: "查询", formBind: true, handler: queryStore, margin: "0 3" }
					]
				});
				qryfrm.load();
				function queryStore() {
					sySto.removeAll();
					sySto.proxy.extraParams = qryfrm.getForm().getValues();
					sySto.load();
				}
				function sctDpt(cmb, rec) {
					let dpt = rec[0].data.dptno;
					spSto.clearFilter();
					spSto.filter("dptno", new RegExp("^" + dpt + "$"));
					qryfrm.getForm().findField("spno").setValue("");
				}

				let sySto = Ext.create("Edu.store.LabPlan");
				Ext.apply(sySto.proxy, {
					url: "/student/labplan",
					actionMethods: {
						read: "GET"
					}
				});
				var grid = Ext.create("Edu.view.ShowGrid", {
					height: "50%",
					region: "center", title: "实验计划",
					store: sySto,
					columns: [
						{ header: "序号", xtype: "rownumberer", width: 40 },
						{ header: "年级", dataIndex: "grade", width: 60 },
						{ header: "专业", dataIndex: "spname", width: 100 },
						{ header: "课程代号", dataIndex: "courseid", width: 95 },
						{ header: "课程名称", dataIndex: "cname", width: 160 },
						{ header: "实验学时", dataIndex: "syxs", width: 60 },
						{ header: "上机学时", dataIndex: "qtxs", width: 60 },
						{ header: "实践学时", dataIndex: "sjxs", width: 60 },
						{ header: "实验室", dataIndex: "srname", width: 160 },
						{ header: "备注", dataIndex: "comm", width: 160, editor: {} }
					],
					listeners: {
						"select": function (e, r) {
							xmSto.proxy.extraParams.labid = r.data.planid;
							xmSto.load();
						}
					}
				});

				var xmSto = Ext.create("Edu.store.LabItem");
				Ext.apply(xmSto.proxy, { url: "/student/labitem" });
				var xmGd = Ext.create("Edu.view.ShowGrid", {
					title: "实验计划项目", region: "south", height: "50%",
					store: xmSto,// tools: [{ xtype: "button", text: "内容导入", value: "", iconCls: "down", handler: impCj }],
					columns: [
						{ header: "序号", xtype: "rownumberer", width: 30 },
						{
							header: "操作", xtype: "actionrendercolumn", width: 40, dataIndex: "scted",
							renderer: function (v) { if (!v) return ["选课"]; },
							items: [{
								handler: function (grid, rowIndex, colIndex) {
									var rec = grid.getStore().getAt(rowIndex);
									grid.getSelectionModel().select(rec);
									sctcno(rec);
								}
							}]
						},
						{ header: "已选", width: 40, xtype: "booleancolumn", trueText: "是", falseText: "否", dataIndex: "scted" },
						{ header: "项目号", dataIndex: "xh", width: 90 },
						{ header: "项目", dataIndex: "itemname", width: 180 },
						{ header: "学时", dataIndex: "syxs", width: 40 },
						{ header: "实验类别", dataIndex: "sylb", width: 140 },
						{ header: "实验类型", dataIndex: "sylx", width: 100 },
						//{ header: "实验室", dataIndex: "srid", width: 160 },
						{ header: "备注", dataIndex: "comm", minWidth: 50, flex: 1 }
					],
					listeners: { "select": function (e, r) { pcSto.proxy.extraParams.xh = r.data.xh; pcSto.load(); } }
				});

				function sctSubmit(rec) {
					var rw = this;
					Ext.Ajax.request({
						url: "/student/labSave", //请求的地址
						params: rec.data,
						method: "POST",
						success: function (response, opts) {
							var obj = Ext.decode(response.responseText);
							if (obj.success) {
								//var msg = "选课已经成功：" + rs[0].get("courseno");
								Ext.Msg.alert("成功", obj.msg, function () {
									var jg = xmGd.getSelectionModel().getSelection();
									if (jg.length > 0) {
										jg[0].data.scted = 1; jg[0].commit(); rw.up("window").close();
									}
								});
							} else {
								Ext.Msg.alert("错误", obj.msg);
							}
						},
						failure: function (response, opts) {
							Ext.Msg.alert("错误",
								"状态:" + response.status + ": " +
								response.statusText);
						}
					});
				}
				var ztAry = [["", "全部"], ["在校", "在校"], ["离校", "离校"]];
				var stfrm = new Ext.form.Panel({
					method: "post", region: "north",
					frame: true,
					bodypadding: "0", margin: 0,
					fieldDefaults: { labelSeparator: ":", labelAlign: "right", labelWidth: 35, margin: "0 0 6 0" },
					layout: "fit",
					viewConfig: { forceFit: true, stripeRows: true },
					items: [{
						xtype: "fieldset",
						title: "请输入查询条件，按查询键开始",
						layout: "column", defaultType: "textfield",
						defaults: { anchor: "100%" },
						items: [{ name: "grade", xtype: "numberfield", labelWidth: 40, fieldLabel: "年级", width: 90, hideTrigger: true, size: 6 },
						{
							xtype: "combo", name: "spno", fieldLabel: "专业",
							store: spSto, queryMode: "local", displayField: "text", width: 240, triggerAction: "all",
							valueField: "spno", blankText: "请选择专业"
						}, {
							width: 100, xtype: "combo", name: "changetype", fieldLabel: "状态", store: ztAry, queryMode: "local", editable: false, value: "在校"
						}, {
							fieldLabel: "班级", labelWidth: 50, name: "classno", xtype: "numberfield", hideTrigger: true
						}, {
							fieldLabel: "起始学号", name: "ksstid", labelWidth: 60, xtype: "textfield", width: 140
						}, {
							fieldLabel: "截止学号", name: "jsstid", labelWidth: 60, xtype: "textfield", width: 140
						}, {
							fieldLabel: "学号", name: "stid", labelWidth: 40, xtype: "textfield", width: 140
						}, {
							fieldLabel: "姓名", name: "name", labelWidth: 40, xtype: "textfield", width: 140
						}, {
							margin: "0 3", xtype: "button", text: "查询学生", formBind: true, handler: qrySt
						}]
					}]
				});
				function qrySt() {
					var f = this.up("panel").getForm();
					if (f.isDirty()) {
						var sto = stGrid.getStore();
						sto.proxy.extraParams = f.getValues();;
						sto.load();
					}
				}
				var stSto = Ext.create("Ext.data.Store", {
					fields: ["dptname", "dptno", "spno", "spname", "grade", "classno", "stid", "name", "sex", "changetype", "comm"],
					proxy: {
						type: "ajax", url: "/Student/GetStuList", reader: { type: "json", root: "data" }
					}
				});
				var stGrid = Ext.create("Ext.grid.Panel", {
					columnLines: true, region: "center", selType: "checkboxmodel", selModel: { mode: "MULTI" },
					plugins: "bufferedrenderer",
					sortableColumns: false,
					layout: "fit",
					store: stSto,
					columns: [
						{ header: "序号", xtype: "rownumberer", width: 40 },
						{ header: "学号", dataIndex: "stid", width: 80 },
						{ header: "姓名", dataIndex: "name", width: 60 },
						{ header: "性别", dataIndex: "sex", width: 30 },
						{ header: "状态", dataIndex: "changetype", width: 40 },
						{ header: "年级", dataIndex: "grade", width: 40 },
						{ header: "班级", dataIndex: "classno", width: 80 },
						{ header: "专业", dataIndex: "spno", flex: 1, minWidth: 80, renderer: function (v) { return sctDropDown(v, spSto, "spno", "spname"); } }
					]
				});
				var pcSto = Ext.create("Edu.store.LabBatch");
				var gdcno = Ext.create("Edu.view.ShowGrid", {
					selType: "checkboxmodel",
					store: pcSto,
					columns: [
						{
							xtype: "actionrendercolumn", header: "操作",
							width: 40,
							renderer: function (v) { return ["提交"]; },
							items: [{
								handler: function (grid, rowIndex, colIndex) {
									var rec = grid.getStore().getAt(rowIndex);
									grid.getSelectionModel().select(rec);
									sctSubmit(rec);
								}
							}]
						},
						{ header: "批次", dataIndex: "bno", width: 35, editor: { xtype: "numberfield", hideTrigger: true } },
						{ header: "周次", dataIndex: "zc", width: 35 },
						{ header: "星期", dataIndex: "xq", width: 35 },
						{ header: "大节", dataIndex: "jc", width: 35 },
						{ header: "人数", dataIndex: "persons", width: 35 },
						{ header: "实验教师", dataIndex: "name", width: 60 },
						{ header: "备注", dataIndex: "comm", minWidth: 50, flex: 1 }
					]
				});
				var win;
				function sctcno(rec) {
					pcSto.removeAll();
					var sto = gdcno.getStore();
					sto.proxy.extraParams.xh = rec.data.xh;
					sto.load();
					if (!win) {
						win = Ext.create("Ext.window.Window", {
							modal: true, height: "80%", width: "80%", layout: "fit", closeAction: "hide",
							items: [gdcno]
						});
					}
					win.setTitle(rec.data.itemname + "(" + rec.data.xh + ")");
					win.show();
				}
				let pan = Ext.create("Edu.view.ShowPanel", {
					title: "实验选课【插件】",
					items: [qryfrm, grid, xmGd]
				});

				me.add(pan);
			}
		}
	};
	plugTools.menuChange(CourseSetNew);
	plugTools.menuChange(StuScoreNew);
	plugTools.menuChange(SutSctedNew);
	plugTools.menuChange(StuPlanNew);
	// plugTools.menuAdd(LabSctNew);

	let panel = Ext.getCmp("content_panel");
	// FIXME: [2] <添加通用处理> {批量处理应该交给tools} 
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
	// FIXME: [2] <添加首页处理> {特殊处理应该交给tools}
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

				// XXX: 重写加载新信息的方式
				let gdSto = Ext.create("Edu.store.NewsInfo", {
					autoLoad: true,
					// 添加了一个新的属性isPluger
					fields: ["id", "title", "content", "postdate", "operator", "ntype", "reader", "showdate", "chk", "openshow", "isPluger"],
					listeners: {
						"load": function (me, data) {
							grid.setVisible(data.length > 0);
							let rec = me.findRecord("openshow", 1);
							if (rec) showMsg(rec.data);
							// XXX: 尝试在这里添加一下获取新信息
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

				// XXX: 重写显示新信息的方式
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