// ==UserScript==
// @name         Take Lessons
// @namespace    https://github.com/cssxsh/Guet_SctCoz_Plug-ins
// @version      4.7.4
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
	// 初始化工具
	if (!SctCoz.tools.inited) SctCoz.tools.init({ debugLevel: 0 });
	// if (SctCoz.tools.ClassStorage.Load("value", "T_L_Col") != null) {
	// 	SctCoz.tools.ClassStorage.Save("value", col, "T_L_Col");
	// }

	var Rreplace_StuSct = function (me, opts) {
		// 判断模块是否符合
		var sctType = "";
		switch (me.id) {
			case ("StuSct"):
				sctType = "正常";
				break;
			case ("StuSctCx"):
				sctType = "重修";
				break;
			default:
				//不符合要求退出
				SctCoz.tools.Logger("类型错误：" + me.id, 2, "By Rreplace_StuSct");
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
		// 用户信息里有stype会覆盖
		user.stype = sctType;
		queryForm.getForm().setValues(user);
		
		
		
		var loadCourseNo = function (record) {
			sctStore.removeAll();
			sctGrid.SelectRecord = record;
			let selfMajor = record.get("spno");
			let cname = record.get("cname");
			let courseid = record.get("courseid");
			let col = SctCoz.tools.ClassStorage.Load("value", "T_L_Col");


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
			sctGrid.setTitle(cname + "[" + courseid + "]");
			// 按钮分情况显示
			// 选了课之后就不会再回弹课号了
			// sctGrid.down("[action='select']").setVisible(!record.get("scted"));
			// sctGrid.down("[action='take']").setVisible(!record.get("scted"));
		};
		var selectCourse = function (button, event) {
			let grid = button.up("[xtype='select-grid']");
			let selectRecord = grid.getSelectionModel().getLastSelected();

			if (selectRecord != null) {
				let params = selectRecord.getData();
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
							Ext.Msg.alert("失败", result.msg);
						}
					},
					failure: function (response, opts) {
						Ext.Msg.alert("网络错误", response.status + ": " + response.statusText);
					}
				});
			} else {
				Ext.Msg.alert("提示", "请选择一个课号提交。");
			}
		};
		var takeCourse = function (button, event) {
			let grid = button.up("[xtype='select-grid']");
			let selectRecord = grid.getSelectionModel().getLastSelected();
			var col = SctCoz.tools.ClassStorage.Load("value", "T_L_Col");

			if (selectRecord != null) {
				var params = selectRecord.getData();
				params.stype = sctType;
				
				// SctCoz.tools.Logger("抢课开始，课号：" + params.courseno, 2, "By takeCourse");
				
				var task = {
					run: function () {
						Ext.Ajax.request({
							url: "/student/SctSave", // 保存选课记录接口
							params: params,
							method: "POST",
							success: function (response, opts) {
								let result = Ext.decode(response.responseText);
								//var overflow = window.SctCoz.tools.ClassStorage.Get("value", "StuSctCol");
								if (result.success) {
									Ext.TaskManager.stop(task);
									Ext.Msg.hide();
									Ext.Msg.alert("成功", result.msg, function close() {
										selectRecord.set("scted", true);
										selectRecord.commit();
										loadCourseNo(selectRecord);
										// SctCoz.tools.Logger("抢课结束，课号：" + params.courseno, 2, "By takeCourse");
									});
									// 下面这句判断应该用正则表达式
									// TODO: [8] <添加更多条件> {除了选课人数满应该还有其他条件}
								} else if ("课程:" + params.courseno + "选择失败，选课人数已满!" == result.msg || col.overflow) {
									Ext.Msg.updateProgress(Ext.TaskManager.timerId % 100 / 100);
									// SctCoz.tools.Logger("抢课进行中，课号：" + params.courseno, 2, "By takeCourse");
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
				Ext.Msg.show({
					title: "提示",
					msg: "点击提示框左上角停止选课。",
					icon: Ext.Msg.INFO,
					closable: true,// Ext控件好像没有办法同时显示进度框和按钮
					progress: true,
					progressText: "课号: " + params.courseno + " 正在抢课！",
					fn: function () {
						Ext.TaskManager.stop(task);
					}
				});
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
					let col = SctCoz.tools.ClassStorage.Load("value", "T_L_Col");
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
				// { header: "学期", dataIndex: "term", width: 120, renderer: function (value) { return SctCoz.tools.transvalue(value, "TermStore", "term", "termname") } },
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
							let text = SctCoz.tools.transvalue(spno, "MajorNoStore", "spno", "text");
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
				{ header: "课程序号", dataIndex: "courseno",  width: 70 },
				{ header: "容量", dataIndex: "maxstu", width: 56 },
				{ header: "已选", dataIndex: "sctcnt", width: 48 },
				{ header: "抽签", dataIndex: "lot", width: 48, xtype: "booleancolumn", trueText: "是", falseText: "否" },
				{ header: "教师", dataIndex: "name", width: 72 },
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
	SctCoz.tools.menuChange(StuSctNew);
	SctCoz.tools.menuChange(StuSctCxNew);
});