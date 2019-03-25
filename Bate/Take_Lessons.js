// ==UserScript==
// @name         Take Lessons
// @namespace    https://github.com/cssxsh/Guet_SctCoz_Plug-ins
// @version      4.7.0
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
		allcourseno: true	// 开启全课号
	};
	// 创建工具
	let plugTools = SctCoz.tools;
	if (!plugTools.inited) plugTools.init({ debugLevel: 0 });
	// if (plugTools.ClassStorage.Get("value", "T_L_Col") == null) {
	// 	col = plugTools.ClassStorage.Get("value", "T_L_Col");
	// } else {
	// 	plugTools.ClassStorage.Save("value", col, "T_L_Col");
	// }

	// 创建修改并应用
	var StuSctNew = {
		action: "StuSct",
		text: "选课",
		id: "StuSct",
		listeners: {
			afterrender: function (me, opt) { Rreplace_StuSct("StuSct", col, me) }
		},
		isAutoLoad: !col.old_hide
	}
	var StuSctCxNew = {
		action: "StuSctCx",
		text: "重学选课",
		id: "StuSctCx",
		listeners: {
			afterrender: function (me, opt) { Rreplace_StuSct("StuSctCx", col, me) }
		},
		isAutoLoad: !col.old_hide
	}
	plugTools.menuChange(StuSctNew);
	plugTools.menuChange(StuSctCxNew);

	// 通用加载方法
	function Rreplace_StuSct(module, col, me) {
		//判断模块是否符合
		let scttype = "";
		switch (module) {
			case ("StuSct"):
				scttype = "正常";
				break;
			case ("StuSctCx"):
				scttype = "重修";
				break;
			default:
				//不符合要求退出
				return;
		}
		//加载修改过的功能
		Ext.QuickTips.init();
		Ext.form.Field.prototype.MsgTarget = "side";

		let dptSto = Ext.data.StoreManager.lookup("dptSto");
		let tmSto = Ext.data.StoreManager.lookup("xqSto");
		let cnoSto = Ext.create("Ext.data.Store", {
			fields: ["term", "courseno", "grade", "spno", "scted", "name", "ap", "xf", "lot", "courseid", "stype", "maxstu", "sctcnt", "comm"],
			proxy: {
				type: "ajax", url: "/student/GetPlanCno",
				reader: {
					type: "json",
					root: "data"
				}
			},
			groupField: "spno"
		});
		let setSto = Ext.create("Ext.data.Store", {
			fields: ["id", "term", "courseid", "cname", "spno", "grade", "tname", "xf", "scted"],
			proxy: {
				type: "ajax",
				url: "/student/GetPlan",
				reader: {
					type: "json",
					root: "data"
				}
			},
			listeners: {
				// 加载课程计划
				load: function (sto, recs, opt) {
					sto.plans.clear();
					recs.forEach(function (rec) {
						Ext.Ajax.request({
							url: "/Query/GetCoursePlan",
							params: {
								courseid: rec.get("courseid"),
								term: rec.get("term")
							},
							success: function (resp, opts) {
								sto.plans.add(rec.get("courseid"), Ext.decode(resp.responseText).data);
							}
						});
					});
				}
			},
			plans: Ext.create("Ext.util.HashMap")	//用来记录课程计划
		});
		// 取新写的store
		let spSto = Ext.data.StoreManager.lookup("spnoSto");

		let sctDptListeners = {
			select: function (cmb, rec) {
				let dpt = rec[0].get("dptno");
				spSto.clearFilter();
				spSto.filter([
					{ property: "dptno", value: new RegExp("^" + dpt + "$") },
					// 过滤不启用专业
					{ property: "used", value: "1" }
				]);
				qryfrm.getForm().findField("spno").setValue("");
			},
			change: function (me, newValue, oldValue) {
				if (oldValue == null) {
					spSto.filter([
						{ property: "dptno", value: new RegExp("^" + newValue + "$") },
						{ property: "used", value: "1" }
					]);
				}
			}
		};
		var qryfrm = Ext.create("Edu.view.QueryForm", {
			url: "/student/StuInfo",
			labelWidth: 60,
			argcols: [
				{ xtype: "termcombo", store: tmSto, value: getTerm()[1], allowBlank: false, labelWidth: 30, readOnly: true },
				{ xtype: "gradecombo", allowBlank: false, labelWidth: 30, width: 120, size: 6 },
				{ xtype: "dptcombo", store: dptSto, fieldLabel: "开课学院", editable: false, listeners: sctDptListeners },
				{ xtype: "kscombo", store: spSto, width: 240, allowBlank: false },
				{ xtype: "hidden", fieldLabel: "选课类别", name: "stype", value: scttype },
				{ xtype: "button", handler: queryStore, text: "查询", margin: "0 3", formBind: true }
			]
		});
		qryfrm.load();
		let Items = [{ handler: function (grid, rowIndex, colIndex) { let rec = grid.getStore().getAt(rowIndex); grid.getSelectionModel().select(rec); sctcno(rec); } }];
		var grid = Ext.create("Edu.view.ShowGrid", {
			store: setSto,
			columns: [
				{ xtype: "rownumberer", header: "序号", width: 40 },
				{ dataIndex: "scted", header: "操作", xtype: "actionrendercolumn", width: 40, renderer: function (v) { if (!v) { return ["选课"]; } }, items: Items },
				{ dataIndex: "scted", header: "已选", xtype: "booleancolumn", trueText: "是", falseText: "否", width: 40 },
				{ dataIndex: "courseid", header: "课程代码", width: 95 },
				{ dataIndex: "cname", header: "课程名称", width: 240 },
				{ dataIndex: "tname", header: "课程性质", minWidth: 60 },
				{ dataIndex: "xf", header: "学分", width: 40 }
			]
		});

		function queryStore() {
			let params = qryfrm.getForm().getValues();
			setSto.removeAll();
			setSto.proxy.extraParams = params;
			setSto.load();
		}
		function sctSubmit() {
			var gd = this.up("grid");
			var rs = gd.getSelectionModel().getSelection();
			if (rs.length > 0) {
				rs[0].data.stype = qryfrm.getValues().stype;
				Ext.Ajax.request({
					url: "/student/SctSave", //请求的地址
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
									gd.up("window").close();
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
			} else {
				Ext.Msg.alert("提示", "请选择一个课号提交。");
			}
		}
		function sctSubmit_() {
			var gd = this.up("grid");
			var rs = gd.getSelectionModel().getSelection();
			if (rs.length > 0) {
				rs[0].data.stype = qryfrm.getValues().stype;
				var task = {
					run: function () {
						Ext.Ajax.request({
							url: "/student/SctSave", //请求的地址
							params: rs[0].data,
							method: "POST",
							success: function (response, opts) {
								var obj = Ext.decode(response.responseText);
								//var overflow = window.plugTools.ClassStorage.Get("value", "StuSctCol");
								if (obj.success) {
									Ext.TaskManager.stop(task);
									Ext.Msg.hide();
									Ext.Msg.alert("成功", obj.msg, function () {
										var jg = grid.getSelectionModel().getSelection();
										if (jg.length > 0) {
											jg[0].data.scted = 1;
											jg[0].commit();
											cnoSto.removeAll();
											gd.up("window").close();
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
								Ext.Msg.alert("错误", "状态:" + response.status + ": " + response.statusText);
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
		function sctcno(rec) {
			cnoSto.removeAll();
			if (rec.get("scted") == 1) {
				return Ext.Msg.alert("提示", "本课程已选！");
			}
			var gdcno = Ext.create("Edu.view.ShowGrid", {
				selType: "checkboxmodel",
				selModel: { mode: "SINGLE" },
				store: cnoSto,
				tbar: [
					{ xtype: "button", text: "提交", handler: sctSubmit },
					{ xtype: "button", text: "抢课", handler: sctSubmit_ }
				],
				features: [{
					ftype: "groupingsummary",
					groupHeaderTpl: Ext.create("Ext.XTemplate", "<div>{groupValue:this.formatName}共{children.length}个课号</div>", {
						formatName: function (groupValue) {
							let text = sctDropDown(groupValue, spSto, "spno", "spname");
							return qryfrm.getValues().spno == groupValue ? "<span style='color:red;'>" + text + "</span>" : text;
						}
					})
				}],
				columns: [
					{ header: "序号", xtype: "rownumberer", width: 30 },
					{ dataIndex: "spno", header: "专业", width: 94, renderer: function (v) { return sctDropDown(v, spSto, "spno", "spname"); } },
					{ dataIndex: "courseno", header: "课程序号", width: 70 },
					{ dataIndex: "maxstu", header: "容量", width: 35 },
					{ dataIndex: "sctcnt", header: "已选", width: 35 },
					{ dataIndex: "lot", header: "抽签", width: 35, xtype: "booleancolumn", trueText: "是", falseText: "否" },
					{ dataIndex: "grade", header: "年级", width: 45 },
					{ dataIndex: "xf", header: "学分", width: 40 },
					{ dataIndex: "name", header: "教师", width: 80 },
					{ dataIndex: "ap", header: "上课安排", width: 94, flex: 1 }
				]
			});
			var win = Ext.create("Ext.window.Window", {
				title: rec.get("cname") + "(" + rec.get("courseid") + ")",
				modal: true, height: "80%", width: "80%", layout: "fit",
				items: [gdcno]
			});
			// XXX: [3] <优化性能问题> {解决性能问题} (调整获取课程计划的时间)
			if (col.allcourseno) {
				setSto.plans.get(rec.get("courseid")).forEach(function (p) {
					cnoSto.proxy.extraParams.id = p.pid;
					cnoSto.load({ addRecords: true });
				});
			} else {
				cnoSto.proxy.extraParams = rec.data;
				cnoSto.load();
			}
			win.show();
		}
		let pan = Ext.create("Edu.view.ShowPanel", {
			title: "学生" + scttype + "选课【插件模式】",
			items: [
				{ region: "north", layout: "fit", items: [qryfrm] },
				{ region: "center", layout: "fit", items: [grid], flex: 3 }
			]
		});
		me.add(pan);
	}
});