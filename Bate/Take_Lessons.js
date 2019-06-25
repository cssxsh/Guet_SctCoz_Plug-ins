// ==UserScript==
// @name         Take Lessons
// @namespace    https://github.com/cssxsh/Guet_SctCoz_Plug-ins
// @version      4.7.2
// @description  新教务抢课脚本
// @author       cssxsh
// @include      http://bkjw.guet.edu.cn/Login/MainDesktop
// @include      http://172.16.13.22/Login/MainDesktop
// @updateURL    https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate/Take_Lessons.js
// @installURL   https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate/Take_Lessons.js
// @downloadURL  https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate/Take_Lessons.js
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
		ver: "0.3",			// 主要版本号
		time: 1000,			// 抢课时间间隔
		old_hide: true,		// 旧模块是否隐藏
		overflow: false,	// 关闭以课程人数已满为继续抢课条件
		all: true			// 开启全课号
	};
	// 创建工具
	let plugTools = SctCoz.tools;
	if (!plugTools.inited) plugTools.init({ debugLevel: 0 });
	if (plugTools.ClassStorage.Load("value", "T_L_Col") != null) {
		plugTools.ClassStorage.Save("value", col, "T_L_Col");
	}

	var Rreplace_StuSct = function (me, opts) {
		// 判断模块是否符合
		var sctType = "";
		var col = plugTools.ClassStorage.Load("value", "T_L_Col");
		switch (me.id) {
			case ("StuSct"):
				sctType = "正常";
				break;
			case ("StuSctCx"):
				sctType = "重修";
				break;
			default:
				//不符合要求退出
				plugTools = plugTools.Logger("类型错误：" + me.id, 2, "By Rreplace_StuSct");
				return;
		}
		// 
		Ext.QuickTips.init();
		Ext.form.Field.prototype.MsgTarget = "side";

		var queryByStore = function (button, event) {
			let panel = button.up("[xtype='query-panel']");
			let grid =  panel.down("[xtype='query-grid']");
			let store = grid.getStore();
			let formSet = panel.down("[xtype='query-form']").getForm();
			let params = formSet.getValues();

			store.getProxy().extraParams = params;
			let term = formSet.findField("term").getDisplayValue();
			let spno = formSet.findField("spno").getDisplayValue();
			let grade = formSet.findField("grade").getDisplayValue();
			grid.printTitle = term + " " + grade + "级 " + spno + " 可选课程";
			store.load();
		};
		var queryForm = Ext.create("SctCoz.Query.QueryForm", {
			argcols: [
				{ fieldLabel: "开课学期", xtype: "TermCombo", readOnly: true, value: SctCoz.Comm.getSctCozTerm() },
				{ fieldLabel: "开课年级", xtype: "GradesCombo", allowBlank: false },
				{ fieldLabel: "开课学院", xtype: "CollegeCombo", allowBlank: false }, 
				{ fieldLabel: "开课专业", xtype: "MajorCombo", allowBlank: false },
				{ fieldLabel: "选课类别", xtype: "hidden", name: "stype", value: sctType },
			],
			QueryByStore: queryByStore
		});
		let user = SctCoz.Student.getUserInfo();
		// 用户信息里有
		user.xtype = sctType;
		queryForm.getForm().setValues(user);
		
		
		
		var loadCourseNo = function (record) {
			sctStore.removeAll();
			sctGrid.SelectRecord = record;
			let selfMajor = record.get("spno");
			let cname = record.get("cname");
			let courseid = record.get("courseid");

			if (record.get("scted")) {
				// 已选课的情况
			} else {
				// 未选课的情况
				// XXX: [3] <优化性能问题> {解决性能问题} (调整获取课程计划的时间)
				if (col.all) {
					sctGrid.selfMajor = selfMajor;
					let records = newStore.AllQueryStore.getGroups().find(function (item) { return item.name == courseid}).children;
					records.forEach(function (record, index, array) {
						sctStore.getProxy().extraParams.id = record.get("pid");
						sctStore.load({ addRecords: true });
					});
					//
				} else {
					sctStore.getProxy().extraParams = record.data;
					sctStore.load();
				}
				sctGrid.setTitle(cname + "(" + courseid + ")");
			}
		};
		var selectCourse = function (button, opts) {
			let grid = button.up("[xtype='select-grid']");
			let selectRecord = grid.SelectRecord;
			let records = grid.getSelectionModel().getSelection();
			if (records.length > 0) {
				let params = records[0].getData();
				params.stype = sctType;
				Ext.Ajax.request({
					url: "/student/SctSave", // 保存选课记录接口
					params: params,
					method: "POST",
					success: function (response, opts) {
						let result = Ext.decode(response.responseText);
						if (result.success) {
							Ext.Msg.alert("成功", result.msg, function close() {
								selectRecord.set("scted", true);
								selectRecord.commit();
								loadCourseNo(selectRecord);
							});
						} else {
							Ext.Msg.alert("错误", result.msg);
						}
					},
					failure: function (response, opts) {
						Ext.Msg.alert("网络错误", response.status + ": " + response.statusText);
					}
				})
			} else {
				Ext.Msg.alert("提示", "请选择一个课号提交。");
			}
		};
		var takeCourse = function (button, opts) {
			let grid = button.up("[xtype='select-grid']");
			let selectRecord = grid.SelectRecord;
			let records = grid.getSelectionModel().getSelection();
			if (records.length > 0) {
				let params = records[0].getData();
				params.stype = sctType;
				var task = {
					run: function () {
						Ext.Ajax.request({
							url: "/student/SctSave", // 保存选课记录接口
							params: params,
							method: "POST",
							success: function (response, opts) {
								let result = Ext.decode(response.responseText);
								//var overflow = window.plugTools.ClassStorage.Get("value", "StuSctCol");
								if (result.success) {
									Ext.TaskManager.stop(task);
									Ext.Msg.hide();
									Ext.Msg.alert("成功", result.msg, function close() {
										selectRecord.set("scted", true);
										selectRecord.commit();
										loadCourseNo(selectRecord);
									});
									// 下面这句判断应该用正则表达式
								} else if ("课程:" + params.courseno + "选择失败，选课人数已满!" == result.msg || col.overflow) {
									Ext.Msg.updateProgress(Ext.TaskManager.timerId % 100 / 100);
								} else {
									Ext.TaskManager.stop(task);
									Ext.Msg.hide();
									Ext.Msg.alert("错误", result.msg);
								}
							},
							failure: function (response, opts) {
								Ext.TaskManager.stop(task);
								Ext.Msg.hide();
								Ext.Msg.alert("网络错误", response.status + ": " + response.statusText);
							}
						});
					},
					interval: col.time
				};
				Ext.TaskManager.start(task);
			} else {
				Ext.Msg.alert("提示", "请选择一个课号提交。");
			}
		};
		var newStore = Ext.create("SctCoz.Student.CoursePlan", {
			AllQueryStore: Ext.create("SctCoz.Query.CoursePlan", {
				// 方便之后使用
				groupField: "courseid",
			}),
			listeners: {
				// 加载课程计划
				load: function (store, records, opts) {
					if (col.all) {
						store.AllQueryStore.removeAll();
						let loadMask = queryGrid.setLoading("全课号信息加载中...");
						records.forEach(function (record, index, array) {
							let params = { term: record.get("term"), courseid: record.get("courseid")};
							store.AllQueryStore.getProxy().extraParams = params;
							store.AllQueryStore.load({ addRecords: true });
						});
						loadMask.hide();
					}
				}
			}
		});
		var queryGrid = Ext.create("SctCoz.Query.QueryGrid", {
			store: newStore,
			width: "43%",
			columns: [
				{ header: "序号", xtype: "rownumberer", width: 40 },
				{ header: "操作", xtype: "actionrendercolumn", dataIndex: "scted", width: 48, 
					renderer: function (scted) { return scted ? ["查询"] : ["选课"]; }, 
					items: [{ handler: function (grid, rowIndex, colIndex) {
						let record = grid.getStore().getAt(rowIndex); 
						loadCourseNo(record); 
					}}]
				},
				{ dataIndex: "scted", header: "已选", xtype: "booleancolumn", trueText: "是", falseText: "否", width: 40 },
				{ header: "学期", dataIndex: "term", width: 120, renderer: function (value) { return plugTools.transvalue(value, "TermStore", "term", "termname") } },
				{ header: "课程代码", dataIndex: "courseid", width: 95 },
				{ header: "课程名称", dataIndex: "cname",  width: 160 },
				{ header: "课程性质", dataIndex: "tname", minWidth: 60 },
				{ header: "学分", dataIndex: "xf", width: 45 }
			]
		});
		var sctStore = Ext.create("SctCoz.Student.CourseSetNo", {
			groupField: "spno",
		});
		var sctGrid = Ext.create("SctCoz.Query.SelectGrid", {
			store: sctStore,
			region: "east", width: "56%",
			title: "请选择课程进行查询",
			features: [{
				ftype: "groupingsummary",
				groupHeaderTpl: ["<div>[{children:this.formatText}]共{children.length}个课号</div>", 
					{
						formatText: function (records) {
							let spno = records[0].get("spno");
							let text = plugTools.transvalue(spno, "MajorNoStore", "spno", "text");
							if ( spno == this.owner.grid.selfMajor) {
								// 本专业突出显示
								text = "<span style='color:red;'>" + text + "</span>";
							}
							return text;
						}
					}
				]
			}],
			columns: [
				{ header: "序号", xtype: "rownumberer", width: 40 },
				{ header: "课程序号", dataIndex: "courseno",  width: 70 },
				{ header: "容量", dataIndex: "maxstu", width: 64 },
				{ header: "已选", dataIndex: "sctcnt", width: 48 },
				{ header: "抽签", dataIndex: "lot", width: 48, xtype: "booleancolumn", trueText: "是", falseText: "否" },
				{ header: "教师", dataIndex: "name", width: 96 },
				{ header: "时间安排", dataIndex: "ap", width: 96, flex: 1 }
			],
			SelectFn: selectCourse,
			TakeFn: takeCourse
		});

		var panel = Ext.create("SctCoz.Query.QueryPanel", {
			TitleText: "学生" + sctType + "选课【插件模式】",
			items: [queryForm, queryGrid, sctGrid]
		});
		me.add(panel);
	}
	// 创建修改并应用
	var StuSctNew = {
		action: "StuSct",
		text: "选课【插件】",
		id: "StuSct",
		listeners: {
			afterrender: Rreplace_StuSct
		},
		isAutoLoad: false
	};
	var StuSctCxNew = {
		action: "StuSctCx",
		text: "重学选课【插件】",
		id: "StuSctCx",
		listeners: {
			afterrender: Rreplace_StuSct
		},
		isAutoLoad: false
	};
	plugTools.menuChange(StuSctNew);
	plugTools.menuChange(StuSctCxNew);
});