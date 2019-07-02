// ==UserScript==
// @name         Interface Optimization
// @namespace    https://github.com/cssxsh/Guet_SctCoz_Plug-ins
// @version      3.7.27
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
		ver: "3.7",			// 主要版本号
		stid_hide: false,	// 学号参数是否隐藏
		sct_hide: false,	// 已选控制是否隐藏
		info_load: false	// 是否加载课程信息
	};
	// 创建工具
	var plugTools = SctCoz.tools;
	if (!plugTools.inited) plugTools.init({ debugLevel: 0 });

	// 创建并应用修改
	var CourseSetNew = {
		action: "QryCourseSet",
		text: "课程设置【插件】",
		id: "QryCourseSet",
		leaf: true,
		isAutoLoad: false,
		listeners: {
			afterrender: function (me, opts) {
				// 提示设置
				Ext.QuickTips.init();
				Ext.form.Field.prototype.MsgTarget = "side";
				// 查询面板
				var queryByStore = function (button, event) {
					let panel = button.up("[xtype='query-panel']");
					let grid =  panel.down("[xtype='query-grid']");
					let store = grid.getStore();
					let formSet = panel.down("[xtype='query-form']").getForm();
					let params = formSet.getValues();
					let weeknum = Ext.data.StoreManager.lookup("TermStore").findRecord("term", params.term).get("weeknum");

					params.startweek = parseInt(params.startweek);
					params.startweek = isNaN(params.startweek) ? 1 : params.startweek;
					params.endweek = parseInt(params.endweek);
					params.endweek =  isNaN(params.endweek) ? weeknum : params.endweek;
					params.fromweek = parseInt(params.fromweek);
					params.fromweek =  isNaN(params.fromweek) ? 1 : params.fromweek;
					params.toweek = parseInt(params.toweek);
					params.toweek =  isNaN(params.toweek) ? 7 : params.toweek;
					params.startsequence = parseInt(params.startsequence);
					params.startsequence =  isNaN(params.startsequence) ? 1 : params.startsequence;
					params.endsequence = parseInt(params.endsequence);
					params.endsequence =  isNaN(params.endsequence) ? 6 : params.endsequence;
					params.tname = params.tname.trim();
					params.courseno = params.courseno.trim();
					params.courseid = params.courseid.trim();
					params.cname = params.cname.trim();
					
					store.getProxy().extraParams = params;
					store.load(function () {
						// 教务自带的过滤有问题，需要本地再次过滤
						// TODO: [7] <完善条件过滤> {应该让被过滤的记录以课号相关联}
						store.filterBy(function (rec) {
							s = parseInt(rec.get('startweek')) < params.startweek;
							t = parseInt(rec.get('endweek')) > params.endweek;
							if (s || t) {
								return false;
							} else {
								return true;
							}
						});
					});
					grid.printTitle = formSet.findField("term").getDisplayValue() + "课程设置";
				};
				var queryForm = Ext.create("SctCoz.Query.QueryForm", {
					argcols: [// xtype里已经封装好了store。
						{ fieldLabel: "开课学期", xtype: "TermCombo" }, 
						{ fieldLabel: "开课年级", xtype: "GradesCombo" },
						{ fieldLabel: "开课学院", xtype: "CollegeCombo" }, 
						{ fieldLabel: "开课专业", xtype: "MajorCombo" },
						{ fieldLabel: "周次", labelWidth: 32, width: 64, name: "startweek"}, { labelWidth: 0, width: 30, name: "endweek" }, 
						{ fieldLabel: "星期", labelWidth: 32, width: 64, name: "fromweek"}, { labelWidth: 0, width: 30, name: "toweek" }, 
						{ fieldLabel: "节次", labelWidth: 32, width: 64, name: "startsequence"}, { labelWidth: 0, width: 30, name: "endsequence" }, 
						{ fieldLabel: "教室", labelWidth: 32, width: 100, name: "croomno"},
						{ fieldLabel: "教师号", labelWidth: 48, width: 110, name: "teacherno"}, 
						{ fieldLabel: "教师", labelWidth: 32, width: 100, name: "tname",}, 
						{ fieldLabel: "课号", labelWidth: 32, width: 110, name: "courseno"}, 
						{ fieldLabel: "课程代码", labelWidth: 64, width: 150, name: "courseid" }, 
						{ fieldLabel: "课程名称", labelWidth: 64, width: 200, name: "cname" },
						{ fieldLabel: "日期", labelWidth: 32, width: 150, name: "date", xtype: "datefield"}, 
						{ fieldLabel: "其他", labelWidth: 32, width: 120, name: "stid", hidden: col.stid_hide }
					],
					QueryByStore: queryByStore
				});
				// 表格
				var showComm = function (grid, rowIndex, colIndex) {
					let store = grid.getStore();
					let info = store.getAt(rowIndex).get("comment");
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
				var checkChange = function (me, index, checked) {
					let store = me.up("grid").getStore();
					let key = store.getAt(index).get("courseno");
					let Group = store.GroupsByNo.get(key);
					Group.forEach(function (record) { record.set("sct", checked); });
				};
				// 日程表
				// FIX-ME: [8] <重写课程表格> {添加和规范化课程表格功能和格式} (教务自带的模块不够好用)
				var openTimeTable = function (button, opts) {
					var panView = Ext.create("SctCoz.Query.Schedule");
					panView.LoadSchedule(false, queryGrid.getStore().getRange().filter(function (record, index, array) {
						return record.get("sct");
					}));
					Ext.create("Ext.window.Window", {
						title: "课程表", width: "85%", height: "85%", modal: true, layout: "fit",
						items: [panView]
					}).show()
				};
				var newStore = Ext.create("SctCoz.Query.CourseSetTable", {
					listeners: {
						load: function (me, records, successful, opts) {
							// 课号分组
							me.GroupsByNo.clear();
							records.forEach(function (record, index, array) {
								let key = record.get("courseno");
								if (me.GroupsByNo.containsKey(key)) {
									me.GroupsByNo.get(key).push(rec);
								} else {
									me.GroupsByNo.add(key, [record]);
								}
							});
							// 获取有信息的课号列表
							if (col.info_load) {
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
						}
					},
					GroupsByNo: Ext.create("Ext.util.HashMap")
				});
				var queryGrid = Ext.create("SctCoz.Query.QueryGrid", {
					store: newStore,
					columns: [
						{ header: "序号", xtype: "rownumberer", width: 40, sortable: false },
						{ header: "选中", dataIndex: "sct", width: 40, xtype: "checkcolumn", hidden: col.sct_hide, editor: { xtype: "checkbox" }, listeners: { checkchange: checkChange } },
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
						{ header: "备注", dataIndex: "comment", xtype: "actionrendercolumn", 
							renderer: function (value, metaData, record) { return (record.get("comment") != null ? ["查看"] : [""]); }, 
							items: [{ handler: showComm }], flex: 1 
						}
					],
					newTbar: [
						{ xtype: "button", text: "转为课表", formBind: true, icon: "/images/date_magnify.png", handler: openTimeTable }
					]
				});
				// 面板
				var queryPanel = Ext.create("SctCoz.Query.QueryPanel", {
					TitleText: "课程设置",
					items: [queryForm, queryGrid]
				});
				// 添加到TAB
				me.add(queryPanel);
			}
		}
	};// 重写完毕
	var StuScoreNew = {
		action: "StuScore",
		text: "成绩查询【插件】",
		id: "StuScore",
		leaf: true,
		isAutoLoad: false,
		listeners: {
			afterrender: function (me, opts) {
				// 提示设置
				Ext.QuickTips.init();
				Ext.form.Field.prototype.MsgTarget = "side";
				// 查询面板
				var queryByStore = function (button, event) {
					let panel = button.up("[xtype='query-panel']");
					let grid =  panel.down("[xtype='query-grid']");
					let store = grid.getStore();
					let formSet = panel.down("[xtype='query-form']").getForm();
					let params = formSet.getValues();

					store.getProxy().extraParams = params;
					grid.printTitle = formSet.findField("term").getDisplayValue() + "学生成绩";
					store.load();
				};
				var queryForm = Ext.create("SctCoz.Query.QueryForm", {
					argcols: [// xtype里已经封装好了store。
						{ fieldLabel: "开课学期", xtype: "TermCombo", allowBlank: true , value: "" }, 
						{ fieldLabel: "课号", labelWidth: 32, width: 110, name: "courseno"}, 
						{ fieldLabel: "课程代码", labelWidth: 64, width: 150, name: "courseid" }, 
						{ fieldLabel: "课程名称", labelWidth: 64, width: 200, name: "cname" }
					],
					QueryByStore: queryByStore
				});
				// 表格
				var queryGrid = Ext.create("SctCoz.Query.QueryGrid", {
					store: Ext.create("SctCoz.Student.Score"),
					columns: [
						{ header: "序号", xtype: "rownumberer", width: 40 },
						{ header: "学期", dataIndex: "term", width: 120, renderer: function (value, metaData, record) { 
							return plugTools.transvalue(value, "TermStore", "term", "termname"); } 
						},
						{ header: "课程代码", dataIndex: "cid", width: 96 },
						{ header: "课号", dataIndex: "cno", width: 64 },
						{ header: "课程名称", dataIndex: "cname", minWidth: 120, width: 120, flex: 1 },
						{ header: "考核成绩", dataIndex: "khcj", minWidth: 32 },
						{ header: "期中成绩", dataIndex: "qzcj", minWidth: 32, hidden: true },
						{ header: "平时成绩", dataIndex: "pscj", minWidth: 32 },
						{ header: "实验成绩", dataIndex: "sycj", minWidth: 32, hidden: true },
						{ header: "成绩", dataIndex: "zpxs", minWidth: 64 },
						{ header: "学分", dataIndex: "xf", width: 64 },
						{ header: "课程性质", dataIndex: "kctype", minWidth: 64, flex: 1 }
					]
				});
				
				var queryPanel = Ext.create("SctCoz.Query.QueryPanel", {
					TitleText: "学生成绩",
					items: [queryForm, queryGrid]
				});
				me.add(queryPanel);
			}
		}
	};// 重写完毕
	var SutSctedNew = {
		action: "StuScted",
		text: "已选课程",
		id: "StuScted",
		leaf: true,
		isAutoLoad: true,
		listeners: {
			add: function (me, opt) {
				// 修改 Grid
				let grid = me.down("showgrid");
				let sto = grid.getStore();
				grid.columns[1].hidden = true;
				grid.columns[3].width = 75;
				grid.columns[4].maxWidth = 240;
				grid.getStore().model.setFields(["teacherno", "teacher", "xf", "classno", "spno", "spname", "tname", "tname1", "grade", "cname", "pycc", "dptno", "xm", "stid", "name", "term", "courseid", "courseno", "stype", "khsj", "state", "xksj", "ip", "comm", "checked", "pscj", "khzt", "cjf", "setjc", "textnum"]);
				grid.headerCt.insert(4, Ext.create("Ext.grid.column.Column", { header: "教师",   dataIndex: "teacher",   width: 100 }));
				grid.headerCt.insert(4, Ext.create("Ext.grid.column.Column", { header: "教师号", dataIndex: "teacherno", width: 100, hidden: true }));
				grid.headerCt.insert(9, Ext.create("Ext.grid.column.Column", { header: "选课费", dataIndex: "cost",      width: 80  }));

				// 修改 fieldset
				let field = me.down("fieldset");
				let form = me.down("queryform").getForm();
				let Label = [
					{ name: "TotalCredits",     fieldLabel: "总计学分", width: 100, labelWidth: 60, editable: false, value: "???" },
					{ name: "CompulsoryCredit", fieldLabel: "必修学分", width: 100, labelWidth: 60, editable: false, value: "???" },
					{ name: "ElectiveCredits",  fieldLabel: "选修学分", width: 100, labelWidth: 60, editable: false, value: "???" },
					{ name: "GeneralCredits",   fieldLabel: "通识学分", width: 100, labelWidth: 60, editable: false, value: "???" },
					{ name: "CourseFee",        fieldLabel: "总选课费", width: 120, labelWidth: 60, editable: false, value: "???" }
				];
				field.add(Label);
				// TODO: [7] <构建专用仓库> {用于整合两个接口的信息的stroe}
				// field.query('[name=term]').forEach( function (item) {
				// 	item.allowBlank = true;
				// });
				field.down("button").handler = function (me, opt) {
					sto.proxy.extraParams = { term: form.getValues().term, comm: form.getValues().comm };
					sto.load();
				}

				// 添加新信息
				// TO-DO: [8] <显示单门学费> {需要了解各个专业的学分与学费对应关系。}
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
		}
	};
	var StuPlanNew = {
		action: "StuPlan",
		text: "计划查询【插件】",
		id: "StuPlan",
		leaf: true,
		isAutoLoad: false,
		listeners: {
			afterrender: function (me, opt) {
				// 创建新的查询表单
				var queryByStore = function (button, event) {
					let panel = button.up("[xtype='query-panel']");
					let grid =  panel.down("[xtype='query-grid']");
					let store = grid.getStore();
					let formSet = panel.down("[xtype='query-form']").getForm();
					store.getProxy().extraParams = formSet.getValues();
					store.load();
					// 设置打印标题
					grid.printTitle = formSet.findField("term").getDisplayValue() + formSet.findField("plan").getDisplayValue();
				}
				var queryForm = Ext.create("SctCoz.Query.QueryForm", {
					argcols: [// xtype里已经封装好了store。
						{ fieldLabel: "开课学期", xtype: "TermCombo" }, 
						{ fieldLabel: "开课年级", xtype: "GradesCombo" },
						{ fieldLabel: "开课学院", xtype: "CollegeCombo" }, 
						{ fieldLabel: "开课专业", xtype: "MajorCombo" },
						{ fieldLabel: "课程代码", labelWidth: 60, width: 150, name: "courseid" }, 
						{ fieldLabel: "计划选择", xtype: "combo", store: [[0, "执行计划"], [1, "培养计划"]], 
							name: "plan", queryMode: "local", value: 0, editable: false, blankText: "请选择计划" 
						}
					],
					QueryByStore: queryByStore
				});
				queryForm.getForm().setValues(SctCoz.Student.getUserInfo());
				// 创建新grid
				var queryGrid = Ext.create("SctCoz.Query.QueryGrid", {
					store: Ext.create("SctCoz.Query.CoursePlan"),
					columns: [
						{ header: "序号", xtype: "rownumberer", width: 35 },
						{ header: "计划序号", dataIndex: "pid", width: 80 },
						{ header: "学期", dataIndex: "term", width: 120, renderer: function (value, metaData, record) {
							return plugTools.transvalue(value, "TermStore", "term", "termname") 
						}},
						{ header: "专业", dataIndex: "spno", width: 160, renderer: function (value, metaData, record) { 
							return plugTools.transvalue(value, "MajorNoStore", "spno", "text") 
						}},
						{ header: "年级", dataIndex: "grade", width: 40 },
						{ header: "课程代码", dataIndex: "courseid", width: 90 },
						{ header: "课程名称", dataIndex: "cname", minWidth: 160 },
						{ header: "课程性质", dataIndex: "tname", width: 100 },
						{ header: "考核<br/>方式", dataIndex: "examt", width: 40 },
						{ header: "学分", dataIndex: "xf", width: 40 },
						{ header: "理论<br/>学时", dataIndex: "llxs", width: 40 },
						{ header: "实验<br/>学时", dataIndex: "syxs", width: 40 },
						{ header: "上机<br/>学时", dataIndex: "qtxs", width: 40 },
						{ header: "实践<br/>学时", dataIndex: "sjxs", width: 40 },
						{ header: "成绩类型", dataIndex: "typeText", width: 80 },
						{ header: "应选课", dataIndex: "mustsct", xtype: "checkcolumn", width: 60 },
						{ header: "学籍<br/>处理", dataIndex: "xjcl", xtype: "checkcolumn", width: 40 },
						{ header: "备注", dataIndex: "comm", width: 60, flex: .6 }
					]
				});
				var queryPanel = Ext.create("SctCoz.Query.QueryPanel", {
					TitleText: "课程计划",
					items: [queryForm, queryGrid]
				});
				// 加载组件
				me.add(queryPanel);
			}
		}
	};// 重写完毕
	var LabSctNew = {
		action: "LabSct",
		controller: "Plug-in",
		id: "LabSct",
		leaf: true,
		text: "实验选课【插件】",
		type: "action",
		isAutoLoad: false,
		listeners: {
			afterrender: function (me, opt) {
				Ext.QuickTips.init();
				Ext.form.Field.prototype.MsgTarget = "side";
				// 专业开课查询
				var qryfrm = Ext.create('Ext.form.Panel', {
					alias: 'widget.queryform',
					frame: true, layout: 'fit', region: 'north',
					fieldDefaults: { labelAlign: 'right', labelWidth: 60, margin: '0 0 6 0' }, 
					viewConfig: { forceFit: true, stripeRows: true },
					items: [{
						xtype: 'fieldset',
						title: '请输入查询条件，按查询键开始',
						layout: 'column',
						defaultType: 'textfield',
						margin: 0,
						items: [// xtype里已经封装好了store。
							{ fieldLabel: '开课学期', labelWidth: 60, width: 200, xtype: 'termcombo', allowBlank: false, value: getTerm()[0] }, 
							{ fieldLabel: '开课年级', labelWidth: 60, width: 120, xtype: 'gradecombo' },
							{ fieldLabel: '开课学院', labelWidth: 60, xtype: 'dptcombo', listeners: { change: changeDpt } }, 
							{ fieldLabel: '开课专业', labelWidth: 60, xtype: 'kscombo' },
							{ xtype: "button", text: "查询", formBind: true, handler: queryStore, margin: "0 3" }
						]
					}]
				});
				qryfrm.getForm().setValues(getzt());
				function queryStore() {
					sySto.removeAll();
					sySto.proxy.extraParams = qryfrm.getForm().getValues();
					sySto.load();
				}
				function changeDpt(cmb, newValue, oldValue) {
					let spno = qryfrm.down("[xtype='kscombo']");
					spno.getStore().clearFilter();
					if (newValue != "" && newValue != null) {
						spno.getStore().filter('dptno', new RegExp('^' + newValue + '$'));
						spno.setValue("");
					}
				}
				// 实验计划
				var sySto = Ext.create("Edu.store.LabPlan");
				Ext.apply(sySto.proxy, { url: "/student/labplan" });
				var grid = Ext.create("Edu.view.ShowGrid", {
					height: "50%", region: "center", title: "实验计划",
					store: sySto,
					columns: [
						{ header: "序号", xtype: "rownumberer", width: 40 },
						{ header: "计划序号", dataIndex: "planid", width: 80 },
						{ header: "年级", dataIndex: "grade", width: 50 },
						{ header: "专业", dataIndex: "spname", width: 100 },
						{ header: "课程代号", dataIndex: "courseid", width: 95 },
						{ header: "课程名称", dataIndex: "cname", width: 160 },
						{ header: "实验室", dataIndex: "srname", width: 160 },
						{ header: "备注", dataIndex: "comm", width: 160 }
					],
					listeners: {
						select: function (e, r) {
							xmSto.proxy.extraParams.labid = r.data.planid;
							xmSto.load();
						}
					}
				});
				// 实验批次
				var xmSto = Ext.create("Edu.store.LabItem");
				Ext.apply(xmSto.proxy, { url: "/student/labitem" });
				var xmGd = Ext.create("Edu.view.ShowGrid", {
					title: "实验计划项目", region: "south", height: "50%",
					store: xmSto,
					columns: [
						{ header: "序号", xtype: "rownumberer", width: 30 },
						{ header: "操作", xtype: "actionrendercolumn", width: 40, dataIndex: "scted",
							renderer: function (v) { if (!v) return ["选批次"]; },
							items: [{
								handler: function (grid, rowIndex, colIndex) {
									var rec = grid.getStore().getAt(rowIndex);
									grid.getSelectionModel().select(rec);
									sctcno(rec);
								}
							}]
						},
						{ header: "已选", width: 40, xtype: "booleancolumn", trueText: "是", falseText: "否", dataIndex: "scted" },
						{ header: "项目号", dataIndex: "xh", width: 90, 
							doSort: function(state) {
								let ds = this.up('grid').getStore();
								let field = this.getSortParam();
								ds.sort({
									property: field, direction: state,
									sorterFn: function(v1, v2) {
										let n1 = parseInt(v1.raw.xh);
										let n2 = parseInt(v2.raw.xh);
										return n1 > n2 ? 1 : (n1 === n2) ? 0 : -1;
									} 
								});
							}
						},
						{ header: "项目", dataIndex: "itemname", width: 360 },
						{ header: "学时", dataIndex: "syxs", width: 40 },
						{ header: "实验类别", dataIndex: "sylb", width: 140 },
						{ header: "实验类型", dataIndex: "sylx", width: 100 },
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
							Ext.Msg.alert("错误", "状态:" + response.status + ": " + response.statusText);
						}
					});
				}
				var pcSto = Ext.create("Edu.store.LabBatch");
				Ext.apply(pcSto.proxy, { url: "/student/itembatch" });
				var gdcno = Ext.create("Edu.view.ShowGrid", {
					// selType: "checkboxmodel",
					store: pcSto,
					columns: [
						{ header: "操作", xtype: "actionrendercolumn", width: 40,
							renderer: function (v) { return ["提交"]; },
							items: [{
								handler: function (grid, rowIndex, colIndex) {
									var rec = grid.getStore().getAt(rowIndex);
									grid.getSelectionModel().select(rec);
									sctSubmit(rec);
								}
							}]
						},
						{ header: "批次", dataIndex: "bno", width: 40, editor: { xtype: "numberfield", hideTrigger: true } },
						{ header: "周次", dataIndex: "zc", width: 40 },
						{ header: "星期", dataIndex: "xq", width: 40 },
						{ header: "大节", dataIndex: "jc", width: 40 },
						{ header: "人数", dataIndex: "persons", width: 40 },
						{ header: "已选人数", dataIndex: "stusct", width: 80 },
						{ header: "实验教师", dataIndex: "name", width: 80 },
						{ header: "实验教室", dataIndex: "srdd", width: 80 },
						{ header: "备注", dataIndex: "comm", minWidth: 50, flex: 1 }
					]
				});
				var win;
				function sctcno(rec) {
					pcSto.removeAll();
					let sto = gdcno.getStore();
					sto.proxy.extraParams.xh = rec.data.xh;
					sto.load();
					if (!win) {
						win = Ext.create("Ext.window.Window", {
							modal: true, height: "60%", width: "60%", layout: "fit", closeAction: "hide",
							items: [gdcno]
						});
					}
					win.setTitle(rec.data.itemname + "(" + rec.data.xh + ")");
					win.show();
				}
				let pan = Ext.create("Edu.view.ShowPanel", {
					title: "实验选课",
					items: [qryfrm, grid, xmGd]
				});

				me.add(pan);
			}
		}
	};
	var labUnSctNew = {
		"action":"LabUnSct","children":[],"command":null,"controller":"Student","id":"bstuk110","leaf":true,"text":"实验退课","type":"action"
	};
	var StuTEMSNew = {
		action: "StuTEMSNew",
		text: "学生评教【插件】",
		id: "StuTEMSNew",
		leaf: true,
		type: "action",
		isAutoLoad: false,
		listeners: {
			afterrender: function (me, opt) {
				// 
				Ext.QuickTips.init();
				Ext.form.Field.prototype.MsgTarget = "side";
				// 查询部分
				var queryByStore = function (button, event) {
					let panel = button.up("[xtype='query-panel']");
					let grid =  panel.down("[xtype='query-grid']");
					let store = grid.getStore();
					let formSet = panel.down("[xtype='query-form']").getForm();
					store.getProxy().extraParams = formSet.getValues();
					store.load();
					// 设置打印标题
					grid.printTitle = formSet.findField("term").getDisplayValue() + "评教列表";
				};
				var queryForm = Ext.create("SctCoz.Query.QueryForm", {
					argcols: [// xtype里已经封装好了store。
						{ fieldLabel: "开课学期", xtype: "TermCombo" , readOnly: true}
					],
					QueryByStore: queryByStore
				});
				// 加载评教数据
				var loadCourseEvalNo = function (record, grid) {
					// 加载评教选项
					evalStore.getProxy().extraParams.term = record.get("term");
					evalStore.getProxy().extraParams.courseno = record.get("courseno");
					evalStore.getProxy().extraParams.teacherno = record.get("teacherno");
					evalStore.load(function(records, operation, success) {
						records.forEach(function (item, index, array) {
							item.set("term", record.get("term"));
							item.set("courseno", record.get("courseno"));
							item.set("teacherno", record.get("teacherno"));
							item.set("courseid", record.get("courseid"));
							item.set("stid", record.get("stid"));
						});
					});
					// 加载评教评语
					evalFrom.load({ 
						url: '/student/JxpgJg', 
						params: evalStore.getProxy().extraParams,
						success: function (me, action) {
							if (action.result.data.length != 0) {
								me.findField("name").setValue(record.get("name"));
								me.findField("type").setValue(record.get("type"));
								me.findField("cname").setValue(record.get("cname"));
								me.setValues(action.result.data[0]);
							} else {
								// 没有保存记录的情况下
								me.setValues(record.getData());
							}
						}
					});

					// 切换到输入页
					let panel = grid.up("[xtype='query-panel']");
					panel.getLayout().next();
					Ext.getCmp("card-prev").setDisabled(false);
					
					panel.down("button[action='save']").setVisible(!record.get("chk"));
					panel.down("button[action='submit']").setVisible(!record.get("chk"));
				};
				var queryGrid = Ext.create("SctCoz.Query.QueryGrid", {
					store: Ext.create("SctCoz.Student.CourseEvalNo"),
					columns: [
						{ header: "序号", xtype: "rownumberer", width: 36 },
						{ header: "操作", xtype: "actiontextcolumn", width: 48, items: [{
							text: "评教", handler: function (grid, rowIndex, colIndex) {
									let record = grid.getStore().getAt(rowIndex);
									loadCourseEvalNo(record, grid); 
								}
							}]
						},
						{ header: "已评", xtype: "booleancolumn", dataIndex: "chk", width: 48 },
						{ header: "课程代码", dataIndex: "courseid", width: 96 },
						{ header: "课程序号", dataIndex: "courseno", width: 96 },
						{ header: "教师号", dataIndex: "teacherno", width: 96, hidden: true },
						{ header: "教师", dataIndex: "name", width: 96 },
						{ header: "类型", dataIndex: "type", width: 96},
						{ header: "课程名称", dataIndex: "cname",  minWidth: 240, flex: 1 }
					]
				});
				var qureyCard = Ext.create("Ext.container.Container", { 
					region: "center", layout: "border", items: [queryForm, queryGrid] 
				});
				// 输入部分
				var evalStore = Ext.create("SctCoz.Student.Evaluation");
				var evalGrid = Ext.create("Ext.grid.Panel", {
					//
					region: "center",
					plugins: [Ext.create("Ext.grid.plugin.CellEditing", { clicksToEdit: 1 })],
					store: evalStore,
					columns: [
						{ header: "序号", xtype: "rownumberer", width: 30 },
						{ header: "指标", dataIndex: "xh", width: 64, renderer: function (value, metaData, record) { return record.get("nr"); } },
						{ header: "学号", dataIndex: "stid", hidden: true},
						{ header: "内容", dataIndex: "zbnh", width: 350 },
						{ header: "评价结果", dataIndex: "score", width: 100, 
							editor: { 
								xtype: "combo", valueField: "value", displayField: "text",
								queryMode: "local", // allowBlank: false,
								store: Ext.create("Ext.data.Store", {
									id: "test",
									fields: ["value", "text"],
									data: []
								}),
								listeners: {
									"expand": function (me, opts) {
										let grid = me.up("[xtype='grid']");
										let record = grid.getSelectionModel().getLastSelected();

										me.clearValue();
										me.getStore().loadData(record.get("grades"));
									}
								}
							},
							renderer: function (score, metaData, record, rowIndex, colIndex, store, view) { 
								let grade = record.get("grades");
								let text = score;
								if (score == null || score == "") return;
								grade.forEach(function (items, index, array) {
									if (items.value == score) {
										text = items.text;
										return true;
									}
								});
								return text;
							}
						}
					]
				});
				var evalSave = function (button, event) {
					evalStore.sync(); 
					let form = button.up("[xtype='form']");
					let params = form.getForm().getValues();
					params.courseid = form.getForm().findField("courseid").getValue();
					params.courseno = form.getForm().findField("courseno").getValue();

					switch (button.action) {
						case "save": 
							params.chk = 0;	// 设置为未评教
							break;
						case "submit": 
							params.chk = 1;	// 设置为已评教
							break;
						default:
							params.chk = 0;	// 设置为未评教，这里只能用数字
							break;
					}

					Ext.Ajax.request({
						url: "/student/SaveJxpgJg", // 保存评语接口
						params: params,
						method: "POST",
						success: function (response, opts) {
							let result = Ext.decode(response.responseText);
							if (result.success) {
								Ext.Msg.alert("成功", result.msg);
								form.down("button[action='save']").setVisible(!params.chk);
								form.down("button[action='submit']").setVisible(!params.chk);
							} else {
								Ext.Msg.alert("失败", result.msg);
							}
						},
						failure: function (response, opts) {
							Ext.Msg.alert("网络错误", response.status + ": " + response.statusText);
						}
					});
				};
				var evalFrom = Ext.create("Ext.form.Panel", {
					region: "east",
					frame: true, 
                    bodypadding: "2",
                    defaultType: "displayfield",
                    fieldDefaults: { labelSeparator: ":", margin: 2, labelAlign: "right", hideEmptyLabel: false, labelWidth: 90, anchor: "0" },
                    layout: { type: "table", columns: 3 },
                    viewConfig: { forceFit: true, stripeRows: true, },
					items: [
						{ xtype: "hidden", name: "lb"},
						{ xtype: "hidden", name: "teacherno"},
						{ xtype: "hidden", name: "term"},
						{ xtype: "hidden", name: "chk"},
						{ xtype: "hidden", name: "stid"},
						{ fieldLabel: "课程代码", name: "courseid", width: 160 },
						{ fieldLabel: "课程序号", name: "courseno", width: 120 },
						{ fieldLabel: "教师", name: "name", width: 180 },
						{ fieldLabel: "类型", name: "type", width: 180 },
						{ fieldLabel: "课程名称", name: "cname",  colspan: 2, minWidth: 240, flex: 1 },
						{ fieldLabel: "评语", rows: 24, cols: 64, colspan: 5, xtype: "textarea", name: "bz" }
					],
					dockedItems: [
						{ xtype: "toolbar", dock: "bottom", layout: { pack: "center" },
							items: [
								{ text: "保存", action: "save",formBind: true, handler: evalSave }, 
								{ text: "提交", action: "submit", formBind: true, handler: evalSave }
							]
						}
					]
				});
				var evalCard = Ext.create("Ext.container.Container", { 
					region: "center", layout: "border", items: [evalGrid, evalFrom] 
				});
				// 面板
				var navigate = function(button){
					let layout = button.up("[xtype='query-panel']").getLayout();
					layout[button.direction]();
					Ext.getCmp("card-prev").setDisabled(!layout.getPrev());
					Ext.getCmp("card-next").setDisabled(!layout.getNext());
				};
				var panel = Ext.create("SctCoz.Query.QueryPanel", {
					TitleText: "学生评教【插件】",  layout: "card",
					items: [qureyCard, evalCard],
					bbar: [{
						id: "card-prev",
						direction: "prev",
						text: "<< 评教查询",
						handler: navigate,
						disabled: true
					}, "->", {
						id: "card-next",
						direction: "next",
						text: "评教输入 >>",
						handler: navigate,
						disabled: true
					}]
				});
				me.add(panel);
			}
		}
	};// 重写完毕


	plugTools.menuChange(CourseSetNew);
	plugTools.menuChange(StuScoreNew);
	plugTools.menuChange(SutSctedNew);
	plugTools.menuChange(StuPlanNew);
	// TO-DO[9]: <添加实验选课> {添加对实验选课的支持}
	plugTools.menuAdd(LabSctNew);
	// plugTools.menuAdd(labUnSctNew);
	plugTools.menuAdd(StuTEMSNew);


	// TODO[9]: <重写课表模块> {把实验课加入课程表, 可以使用评教接口}
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
