// 这是一个接口库
// version 3.5
if (typeof SctCoz == "undefined") {			// 防止重复定义
	Ext.define("SctCoz.tools", {
		config: {
			id: "plug",
		},
		statics: {
			version: "3.5.6",
			inited: false,
			debugLevel: 2,
			SysMenus: null,
			Menus_Tree: null,

			// XXX: 弄一个变量仓库专门管理常用全局变量
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
				let Config = config;
				this.Logger(Config.action + " add...");
				this.Menus_Tree.store.addListener("load",function once (sto) {
					sto.tree.root.appendChild(Config);
				});
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
				SctCoz.Comm.InitStore();
				SctCoz.Student.InitStore();
				this.inited = true;
			},
			// 写一些调试用组件
			// 调试输出
			// FIXME: [5] <优化易用程度> {调用时更加方便易用}
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
			},
			// 转换值表示
			transvalue: function (value, storeId, oldField, newField) {
				let record = Ext.data.StoreManager.lookup(storeId).findRecord(oldField, value);
				// console.log(record.get(newField));
				return record != null ? record.get(newField) : null;
			}
		}
	});
}
if (typeof SctCoz.Comm == "undefined") {	// 防止重复定义
	Ext.define("SctCoz.Comm", {
		alias: ["CommInfo"],
		statics: {
			version: "1.1.1",
			InitStore: function () {
				// 注册Store
				Ext.create("SctCoz.Comm.TermInfo", { id: "TermStore" });
				Ext.create("SctCoz.Comm.ShoolYear", { id: "ShoolYears" });
				Ext.create("SctCoz.Comm.MajorInfo", { id: "MajorNoStore" });
				Ext.create("SctCoz.Comm.CollegeInfo", { id: "CollegeNoStore" });
				Ext.create("SctCoz.Comm.CourseInfo", { id: "CourseIdStore" });
				Ext.create("SctCoz.Comm.HourInfo", { id: "SchoolHour" });
			},
			getNowTerm: function () {
				return Ext.data.StoreManager.lookup("TermStore").nowTerm;
			},
			getShoolYear: function () {
				return Ext.data.StoreManager.lookup("TermStore").shoolYear;
			}
		}
	});
	Ext.define("SctCoz.Comm.TermInfo", {
		alias: ["TermInfo"],
		extend: "Ext.data.Store",
		fields: ["term", "startdate", "enddate", "weeknum", "termname", "schoolyear", "comm"],
		proxy: {
			type: "ajax",
			url: "/Comm/GetTerm",
			reader: {
				type: "json",
				root: "data"
			}
		},
		autoLoad: true,
		sorters: [{ property: "term", direction: "DESC" }],
		// 自定义部分
		nowTerm: [],
		shoolYear: [],
		listeners: {
			load: function (me, records, options) {
				me.nowTerm = [],
				me.shoolYear = [],
				Ext.Ajax.request({
					url: "/Comm/CurTerm", // 获取教务设置
					method: "GET",
					success: function (response, opt) {
						Ext.decode(response.responseText).forEach( function (term, index) {
							me.nowTerm.push(records.find(function (termInfo, index) { return termInfo.get("term") == term ; }));
						});
					},
					failure: function (response, opt) {
						me.nowTerm = records.slice(0, 3);
					}
				});
				me.shoolYear = Ext.Array.unique(records.map( function (termInfo, index) { return termInfo.get("schoolyear"); }));
			}
		}
	});
	Ext.define("SctCoz.Comm.ShoolYear", {
		alias: ["ShoolYearArray"],
		extend: Ext.data.ArrayStore,
		fields: ["grade", "text"]
	});
	Ext.define("SctCoz.Comm.CollegeInfo", {
		alias: ["CollegeInfo"],
		extend: "Ext.data.Store",
		fields: [
			"dptno", "dptname", "engname", "gbno", "zone", "comm", "bbm", "code", "used", 
			{ name: "text", convert: function (value, record) { return record.get("dptno") + " " + record.get("dptname"); } },
			{ name: "CollegeNo", convert: function (value, record) { return parseInt(record.get("dptno")); } }
		],
		proxy: {
			type: "ajax", 
			url: "/Comm/GetDepart", 
			reader: { 
				type: "json", 
				root: "data" 
			}
		}, 
		autoLoad: true,
		sorters: [{ property: "CollegeNo", direction: "ASC" }]
	});
	Ext.define("SctCoz.Comm.MajorInfo", {
		alias: ["MajorInfo"],
		extend: "Ext.data.Store",
		fields: [
			"spno", "spname", "engname", "dptno", "sptype", "gbno", "years", "degree","comm","major", "code", "used",
			{ name: "text", convert: function (value, record) { return record.get("spno") + " " + record.get("spname"); } }
		],
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
	Ext.define("SctCoz.Comm.TeacherInfo", {
		alias: ["TeacherInfo"],
		extend: "Ext.data.Store",
		fields: ["teacherno", "name", "gender", "dptno","labno", "barcode", "occupation", "occuptime", "headship", "degree", "education", "gradudate", "graduspno", "graduschool", "maincourse", "direction", "state", "type", "product", "award", "comm", "jxqk", "oldno"],
		proxy: {
			type: "ajax",
			reader: { 
				type: "json", 
				root: "data" 
			}
		}, 
		autoLoad: false,
		sorters: [
			{ property: "dptno", direction: "ASC" },
			{ property: "teacherno", direction: "ASC" }
		],
		constructor: function (config) {
			this.callParent(arguments); 
			this.proxy.url = config.url;
		},
	});
	Ext.define("SctCoz.Comm.HourInfo", {
		alias: ["HourInfo"],
		extend: "Ext.data.Store",
		fields: [
			"term", "nodeno", "xss", "nodename", "memo",
			"week1", "week2", "week3", "week4", "week5", "week6", "week7", 
		],
		proxy: {
			type: "ajax",
			url: "/comm/gethours",
			reader: {
				type: "json",
				root: "data"
			}
		}, 
		autoLoad: true
	});
	Ext.define("SctCoz.Comm.CourseInfo", {
		alias: ["CourseInfo"],
		extend: "Ext.data.Store",
		fields: ["courseid", "cname", "engname", "used", "llxs", "syxs", "qtxs", "sjxs", "kwxs", "sjzs", "xf", "introduction", "textbook", "reference", "dptno", "cgrade", "labno", "comm", "oldno"],
		proxy: {
			type: "ajax",
			url: "/Comm/GetCourse",
			reader: { 
				type: "json", 
				root: "data" 
			}
		}, 
		autoLoad: false,
		sorters: [
			{ property: "dptno", direction: "ASC" },
			{ property: "teacherno", direction: "ASC" }
		]
	});
	Ext.define("SctCoz.Comm.TermCombo", {
		extend: "Ext.form.field.ComboBox",
		xtype: ["TermCombo"],
		name: "term",
		fieldLabel: "学期",
		minWidth: 160,
		queryMode: "local",
		allowBlank: false,
		valueField: "term",
		displayField: "termname",
		constructor: function (config) {
			Ext.apply(this, Ext.apply({}, config));
			this.callParent(arguments);
			this.labelWidth = this.fieldLabel.length * 16;
			this.store = Ext.data.StoreManager.lookup("TermStore");
			this.setValue(SctCoz.Comm.getNowTerm()[0].get("term"));
		}
	})
	Ext.define("SctCoz.Comm.GradeCombo", {
		extend: "Ext.form.field.ComboBox",
		xtype: ["GradesCombo"],
		name: "grade",
		fieldLabel: "年级",
		width: 150,
		queryMode: "local",
		constructor: function (config) {
			Ext.apply(this, Ext.apply({}, config));
			this.callParent(arguments);
			this.labelWidth = this.fieldLabel.length * 16;
			this.store = Ext.data.StoreManager.lookup("ShoolYears");
			this.store.loadData(SctCoz.Comm.getShoolYear().map(function (value, index, array) { return [parseInt(value), value]; }));
		}
	});
	Ext.define("SctCoz.Comm.CollegeCombo", {
		extend: "Ext.form.field.ComboBox",
		xtype: ["CollegeCombo"], // 直接作为xtype使用
		name: "dptno",
		fieldLabel: "所属学院",
		minWidth: 240,
		queryMode: "local",
		valueField: "dptno",
		listeners: { 
			change: function (combo, newValue, oldValue) {
				let majorNo = combo.up("fieldset").down("[xtype='MajorCombo']");
				let spno = majorNo.getValue();
				majorNo.getStore().clearFilter();
				if (newValue != "" && newValue != null) {
					majorNo.getStore().filter("dptno", new RegExp("^" + newValue + "$"));
					majorNo.setValue("");
					if (majorNo.findRecordByValue(spno) != null && majorNo.findRecordByValue(spno) != false) {
						majorNo.setValue(spno);
					}
				}
			}
		},
		constructor: function (config) {
			Ext.apply(this, Ext.apply({}, config));
			this.callParent(arguments);
			this.labelWidth = this.fieldLabel.length * 16;
			this.store = Ext.data.StoreManager.lookup("CollegeNoStore");
		}
	});
	Ext.define("SctCoz.Comm.MajorCombo", {
		extend: "Ext.form.field.ComboBox",
		xtype: ["MajorCombo"],
		name: "spno",
		fieldLabel: "所属专业",
		minWidth: 240,
		queryMode: "local",
		valueField: "spno",
		constructor: function (config) {
			Ext.apply(this, Ext.apply({}, config));
			this.callParent(arguments);
			this.labelWidth = this.fieldLabel.length * 16;
			// 因为过滤要求这里不能使用注册好的Store
			this.store = Ext.create("SctCoz.Comm.MajorInfo", { autoLoad: false });
			this.store.loadRecords(Ext.data.StoreManager.lookup("MajorNoStore").getRange());
		}
	});
}
if (typeof SctCoz.Student == "undefined") {	// 防止重复定义
	Ext.define("SctCoz.Student", {
		statics: {
			version: "1.1.1",
			InitStore: function () {
				// 注册Store
				Ext.create("SctCoz.Student.PersonInfo", { id: "StudentUser" });
				Ext.create("SctCoz.Student.Schedule", { id: "StudentSchedule" });
			},
			getUserInfo: function () {
				return Ext.data.StoreManager.lookup("StudentUser").getAt(0).getData();
			}
		}
	});
	// TO-DO: [8] <当前用户信息> {弄一个获取当前用户信息的store}
	Ext.define("SctCoz.Student.PersonInfo", {
		extend: "Ext.data.Store",
		fields: [
			"stid", "grade", "classno", "spno", "dptno", "name", "name1", "engname", "sex", "degree", "direction", 
			"changetype", "secspno", "classtype", "idcard", "stype", "xjzt", "changestate", 
			"lqtype", "zsjj", "nation", "political", "nativeplace", "birthday", "enrolldate", "leavedate", 
			"dossiercode", "hostel", "hostelphone", "postcode", "address", "phoneno", "familyheader",
			"total", "chinese", "maths", "english", "addscore1", "addscore2", "comment", "testnum", 
			"fmxm1", "fmzjlx1", "fmzjhm1", "fmxm2", "fmzjlx2", "fmzjhm2", "ds", "xq", "rxfs", "oldno"
		],
		proxy: {
			type: "ajax",
			url: "/Student/GetPerson",
			reader: { 
				type: "json", 
				root: "data" 
			}
		}, 
		autoLoad: true,
		listeners: {
			load: function (me, records, opts) {
				Ext.Ajax.request({
					url: "/student/StuInfo", //请求的地址
					method: "GET",
					success: function (response, opts) {
						records[0].set("dptno", Ext.decode(response.responseText).dptno);
					}
				});
			}
		}
	});
	Ext.define("SctCoz.Student.Schedule", {
		extend: "Ext.data.Store",
		fields: [
			"id", "ctype", "examt", "dptname", "dptno", "spname", "spno", "grade", 
			"cname", "courseno", "teacherno", "name", "term", "courseid", "croomno", "comm", 
			"startweek", "endweek", "oddweek", "week", "seq", "maxcnt", 
			"xf", "llxs", "syxs", "sjxs", "qtxs", "sctcnt", "hours",
			"tname", "name"
		],
		proxy: {
			type: "ajax",
			url: "/student/getstutable",
			reader: { 
				type: "json", 
				root: "data" 
			}
		},
		sorters: [{ property: "courseno", direction: "ASC" }]
	})
}
if (typeof SctCoz.Query == "undefined") {	// 防止重复定义
	Ext.define("SctCoz.Query", {
		statics: {
			version: "1.1.1",
			InitStore: function () {
			}
		}
	});
	Ext.define("SctCoz.Query.QueryPanel", {
		extend: "Ext.panel.Panel", 
		xtype: ["query-panel"],
		bodyPadding: 0, margin: 0, width:"100%", minHeight: 100, layout: "border", 
		viewConfig: { forceFit: true },
		constructor: function (config) {
			Ext.apply(this, Ext.apply({}, config));
			this.title = "<font size=3>" + this.TitleText + "</font>";
			this.callParent(arguments);
		}
	})
	Ext.define("SctCoz.Query.QueryForm", {
		extend: "Ext.form.Panel",
		xtype: ["query-form"],
		frame: true, layout: "fit", region: "north",
		fieldDefaults: { labelAlign: "right", labelWidth: 60, margin: "0 0 6 0" }, 
		viewConfig: { forceFit: true, stripeRows: true },
		items: [],
		constructor: function (config) {
			Ext.apply(this, Ext.apply({}, config));
			this.argcols.push({ xtype: "button", text: "查询", margin: "0 3", formBind: true , handler: this.QueryByStore });
			this.items.push({
				xtype: "fieldset",
				title: "请输入查询条件，按查询键开始",
				layout: "column",
				defaultType: "textfield",
				margin: 0,
				items: this.argcols
			});
			this.callParent(arguments);
		}
	});
	Ext.define("SctCoz.Query.QueryGrid", {
		extend: "Ext.grid.Panel",
		xtype: ["query-grid"],
		columnLines: true,
		width: "100%", height: "100%", minHeight: 400, layout: "fit", region: "center",
		plugins: [Ext.create("Ext.grid.plugin.CellEditing", { clicksToEdit: 1 })],
		viewConfig: { forceFit: true, stripeRows: true, enableTextSelection: true },
		features: [{ ftype: "grouping", id: "groupFea" }],
		printTitle: "", // 打印的主标题
		tbar: [
			{ xtype: "button", text: "打印文档", formBind: true, iconCls: "print", handler: function printGrid(me, opt) { 
				let title = me.up("query-grid").printTitle;
				if (title != null && title != "") Ext.ux.grid.Printer.mainTitle = title;
				Ext.ux.grid.Printer.print(me.up("grid"));
			}},
			{ xtype: "button", text: "导出表格", formBind: true, iconCls: "excel", handler: function printGrid(me, opt) {  
				let title = me.up("query-grid").printTitle;
				if (title != null && title != "") Ext.ux.grid.Printer.mainTitle = title;
				Ext.ux.grid.Printer.ToExcel(me.up("grid"));
			}}
		],
		constructor: function (config) {
			Ext.apply(this, Ext.apply({}, config));
			this.tbar = this.tbar.concat(config.newTbar);
			this.callParent(arguments);
		}
	});
	Ext.define("SctCoz.Query.Schedule", {
		extend: "Ext.panel.Panel", 
		xtype: ["query-schedule"],
		bodyPadding: 0, margin: 1, width:"100%", layout: "border", autoScroll: true, 
		viewConfig: { forceFit: true },
		constructor: function (config) {
			Ext.apply(this, Ext.apply({}, config));
			var grid = Ext.create("SctCoz.Query.QueryGrid", {
				width: "100%",
				store: Ext.data.StoreManager.lookup("SchoolHour"),
				columns: [
					{ header: '节次', dataIndex: 'nodename', minWidth: 64, fiex: 1 },
					{ header: '星期一', dataIndex: "week1", minWidth: 90, flex: 1 },
					{ header: '星期二', dataIndex: "week2", minWidth: 90, flex: 1 },
					{ header: '星期三', dataIndex: "week3", minWidth: 90, flex: 1 },
					{ header: '星期四', dataIndex: "week4", minWidth: 90, flex: 1 },
					{ header: '星期五', dataIndex: "week5", minWidth: 90, flex: 1 },
					{ header: '星期六', dataIndex: "week6", minWidth: 90, flex: 1 },
					{ header: '星期七', dataIndex: "week7", minWidth: 90, flex: 1 },
				]
			});
			var form = Ext.create("Ext.form.Panel", {
				bodyPadding: 2, margin: 1, width: "100%",
				defaultType: "displayfield",
				fieldDefaults: { labelSeparator: ":", margin: 2, labelAlign: "right", hideEmptyLabel: true, labelWidth: 90, anchor: "0" },
				layout: { type: "table", columns: 5 }, // columns 规定每行列数
				viewConfig: { forceFit: true, stripeRows: true, },
				region: "south"
			});
			this.TimeStore =  Ext.create("SctCoz.Student.Schedule");
			this.items = [grid, form];
			this.LoadSchedule = function (isAutoLoad, temp) {
				let form = this.down("[xtype='form']");
				let grid = this.down("[xtype='query-grid']");

				function loaded (records, opts, successful) {
					form.removeAll();
					let flag;
					records.forEach(function (record, index , array) {
						if (flag != record.get("courseno") ) {
							console.log(index);
							form.add([
								{ fieldLabel: "课程序号", labelWidth: 64, width: 110, value: record.get("courseno") }, 
								{ fieldLabel: "课程代码", labelWidth: 64, width: 140, value: record.get("courseid") }, 
								{ fieldLabel: "课程名称", labelWidth: 64, width: 250, value: record.get("cname") },
								{ fieldLabel: "教师姓名", labelWidth: 64, width: 150, value: record.get("name") }, 
								{ fieldLabel: "课程备注", labelWidth: 64, width: 250, value: record.get("comm") }
							]);
							flag = record.get("courseno");
						}
						let week = record.get("week");
						let seq = record.get("seq");
						let Text = grid.getStore().getAt(seq - 1).get("week" + week);
						Text = Text + record.get("cname");
						Text = Text + "<br>(" + record.get("startweek") + "-" + record.get("endweek") + ")"; 
						Text = Text + (record.get("croomno") == null ? "" : record.get("croomno")) + "<br>";
						grid.getStore().getAt(seq - 1).set("week" + week, Text);
					});
					grid.getStore().commitChanges();
				}
				if (isAutoLoad) {
					this.TimeStore.proxy.extraParams.term = temp;
					this.TimeStore.load(loaded);
					grid.printTitle = temp + " 课程表";
				} else {
					this.TimeStore.loadData(temp, loaded);
					grid.printTitle = "排课表";
				}
					// form.add([
					// 	{ fieldLabel: "课程序号", labelWidth: 64, width: 100, value: "courseno" }, 
					// 	{ fieldLabel: "课程代码", labelWidth: 64, width: 150, value: "courseid" }, 
					// 	{ fieldLabel: "课程名称", labelWidth: 64, width: 200, value: "cname" },
					// 	{ fieldLabel: "教师序号", labelWidth: 64, width: 110, value: "teacherno"}, 
					// 	{ fieldLabel: "教师姓名", labelWidth: 64, width: 100, value: "tname" }, 
					// 	{ fieldLabel: "课程备注", labelWidth: 64, width: 250, value: "comm" }
					// ])
			};
			this.callParent(arguments);
		}
	})
	Ext.define("SctCoz.Query.CoursePlan", {
		extend: "Ext.data.Store",
		fields: ["pid", "term", "spno", "grade", "courseid", "cname", "tname", "examt", "xf", "llxs", "syxs", "qtxs", "sjxs", "type", "mustsct", "xjcl", "comm"],
		proxy: {
			url: "/Query/GetCoursePlan",
			type: "ajax",
			reader: {
				type: "json",
				root: "data"
			}
		}
	});
}

// 在测试中添加工具

/*
menu_config = {
	action: "PanId",
	text: "text",
	id: "id",
	listeners: {
		afterrender function (me, opt) {},
		activate: function (me, opt) {},
		add: function (me, opt) {}
	},
	isAutoLoad: false
}
*/