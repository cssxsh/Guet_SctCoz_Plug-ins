// 这是一个接口库
// version 4.1
if (typeof SctCoz == "undefined") {			// 防止重复定义
	Ext.define("SctCoz.tools", {
		config: {
			id: "plug",
		},
		statics: {
			version: "4.1.7",
			inited: false,
			debugLevel: 2,
			SysMenus: null,
			Menus_Tree: null,

			// X-XX: 弄一个变量仓库专门管理常用全局变量
			ClassStorage: {
				// 变量数组
				NewMenus: [],
				NewMenusIdList: [],
				NewStores: [],
				NewStoresIdList: [],
				// TO-DO[8] <添加更多类型> {除了menu还有store等}
				// 操作方法
				Save: function (type, value, key) {
					switch (type) {
						case "menu":
							this.NewMenus.push(value);
							this.NewMenusIdList.push(value.id);
							break;
						case "store":
							this.NewStores.push(value);
							this.NewStores.push(value.id);
							break;
						case "value":
						default: 
							GM_setValue(key, value);
							break;
					}
				},
				Load: function (type, key) {
					let value = null;
					switch (type) {
						case "menu":
							value = this.NewMenus.find(function (item) { return item.id == key });
							break;
						case "store":
							value = this.NewStores.find(function (item) { return item.id == key });
							break;
						case "value":
						default: 
							value = GM_getValue(key);
							break;
					}
					return value;
				},
				Set: function (type, key, setData) {
					switch (type) {
						case "menu":
							this.NewMenus.filter(function (item) { return item.id == key }).forEach(setdata);
							break;
						case "store":
							this.NewStores.filter(function (item) { return item.id == key }).forEach(setdata);
							break;
						case "value":
						default: 
							GM_setValue(setData(GM_getValue(key)));
							break;
					}
				},
				Delete: function (type, key) {
					switch (type) {
						case "menu":
							this.NewMenus.filter(function (item) { return item.id == key }).forEach(NewMenus.splice);
							break;
						case "store":
							this.NewStores.filter(function (item) { return item.id == key }).forEach(NewStores.splice);
							break;
						case "value":
						default: 
							GM_deleteValue(key);
							break;
					}
				},
				getList: function (type) {
					let list;
					switch (type) {
						case "menu":
							list = this.NewMenusIdList;
							break;
						case "store":
							list = this.NewStoresIdList;
							break;
						case "value":
						default: 
							list = GM_listValues();
							break;
					}
					return list;
				}
			},
			// 用来操作菜单的函数
			// TODO[6] <改变菜单方法> {改变菜单的方法应该对store进行处理}
			menuAdd: function (config) {
				this.Logger(config.action + " add...");
				this.Menus_Tree.store.addListener("load",function once (store) {
					store.tree.root.appendChild(config);
				});
				this.ClassStorage.Save("menu", config);
			},
			menuChange: function (config) {
				this.Logger(config.action + " change...");
				this.ClassStorage.Save("menu", config);
			},
			getNewListeners: function (id) {
				let menu = this.ClassStorage.Load("menu", id);
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
				let menu = this.ClassStorage.Load("menu", id);
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
				if (config != null) {
					// this.id = config.id|"plug";
					this.debugLevel = (config.debugLevel == null ? this.debugLevel : config.debugLevel);
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
				let level = (Level == null ? 1 : Level);
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
				let urlByGit = "https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Json/";
				let urlByGuet = "http://experiment.guet.edu.cn/upfile/";
				let url = (isByGit) ? (urlByGit + config.path) : (urlByGuet + config.path.replace(/\//g, "_") + ".rar");
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
				SctCoz.tools.ClassStorage.Save("store", Ext.create("SctCoz.Comm.TermInfo", { id: "TermStore" }));
				SctCoz.tools.ClassStorage.Save("store", Ext.create("SctCoz.Comm.ShoolYear", { id: "ShoolYears" }));
				SctCoz.tools.ClassStorage.Save("store", Ext.create("SctCoz.Comm.MajorInfo", { id: "MajorNoStore" }));
				SctCoz.tools.ClassStorage.Save("store", Ext.create("SctCoz.Comm.CollegeInfo", { id: "CollegeNoStore" }));
				SctCoz.tools.ClassStorage.Save("store", Ext.create("SctCoz.Comm.CourseInfo", { id: "CourseIdStore" }));
				SctCoz.tools.ClassStorage.Save("store", Ext.create("SctCoz.Comm.HourInfo", { id: "SchoolHour" }));
			},
			getNowTerm: function () {
				return Ext.data.StoreManager.lookup("TermStore").termSet[0];
			},
			getSctCozTerm: function () {
				return Ext.data.StoreManager.lookup("TermStore").termSet[1];
			},
			getNextTerm: function () {
				return Ext.data.StoreManager.lookup("TermStore").termSet[2];
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
		termSet: [],
		shoolYear: [],
		listeners: {
			load: function (me, records, options) {
				me.termSet = [],
				me.shoolYear = [],
				Ext.Ajax.request({
					url: "/Comm/CurTerm", // 获取教务设置
					method: "GET",
					success: function (response, opt) {
						Ext.decode(response.responseText).forEach( function (term, index) {
							me.termSet.push(records.find(function (termInfo, index) { return termInfo.get("term") == term; }));
						});
					},
					failure: function (response, opt) {
						me.termSet = records.slice(0, 3);
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
			"term", "nodeno", "xss", "nodename", "memo"
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
			if (this.getValue() == null) {
				this.setValue(SctCoz.Comm.getNowTerm().get("term"));
			}
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
			// 因为过滤要求,不能直接使用注册好的Store，用间接继承数据的办法
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
				SctCoz.tools.ClassStorage.Save("store", Ext.create("SctCoz.Student.PersonInfo", { id: "StudentUser" }));
				// Ext.create("SctCoz.Student.Schedule", { id: "StudentSchedule" });
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
			"xf", "llxs", "syxs", "sjxs", "qtxs", "sctcnt", "hours", "tname", "name", 
			{ name: "sequence", convert: function (value, record) { return (value == null) ? record.get("seq") : value} }
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
	});
	Ext.define("SctCoz.Student.CoursePlan", {
		extend: "Ext.data.Store",
		fields: [
			"id", "term", "courseid", "cname",
			"spno", "grade", "tname", "xf",
			"scted", "courseno", "name",
			"maxstu", "sctcnt", "stid", "comm",
			"lot", "ap", "xm"
		],
		proxy: {
			url: "/student/GetPlan",
			type: "ajax",
			reader: {
				type: "json",
				root: "data"
			},
			extraParams: {
				term: "",
				grade: "",
				dptno: "",
				spno: "",
				stype: ""
			}
		}
	});
	Ext.define("SctCoz.Student.CourseSetNo", {
		//
		extend: "Ext.data.Store",
		fields: [
			"id", "term", "courseid", "cname",
			"spno", "grade", "tname", "xf",
			"scted", "courseno", "name", "maxstu", "sctcnt",
			"stid", "comm", "lot", "ap", "xm"
		],
		proxy: {
			url: "/student/GetPlanCNo",
			type: "ajax",
			reader: {
				type: "json",
				root: "data"
			},
			extraParams: {
				// 计划序号
				id: ""
			}
		}
	});
	Ext.define("SctCoz.Student.CourseEvalNo", {
		// 
		extend: "Ext.data.Store",
		fields: [
			"term", "stid", "courseid", "teacherno", "courseno", "cname", "name", "lb", 
			{ name: "chk", type: "boolean"},
			{ name: "type", persist: false , convert: function (value, record) { return (record.get("lb") == 1 ? "理论课" : "实验课"); } }
		],
		proxy: {
			url: "/student/getpjcno",
			type: "ajax",
			reader: {
				type: "json",
				root: "data"
			},
			extraParams: {
				// 计划序号
				term: ""
			}
		}
	});
	Ext.define("SctCoz.Student.Evaluation", {
		// 
		extend: "Ext.data.Store",
		fields: [
			"term", "teacherno", "stid", "id", "courseno", "courseid",
			"score", "tpye", "bz", "leibie", "nr", "xh", "zb", "qz",
			"zbnh", "state",
			{ name: "dja", persist: false }, { name: "afz", persist: false },
			{ name: "djb", persist: false }, { name: "bfz", persist: false },
			{ name: "djc", persist: false }, { name: "cfz", persist: false },
			{ name: "djd", persist: false }, { name: "dfz", persist: false },
			{ name: "dje", persist: false }, { name: "efz", persist: false },
			"score",
			{ name: "lb" , convert: function (value, record) { 
				return (record.get("leibie") == "实验评估") ? 2 : 1;
			}}, 
			{ name: "grades", persist: false, convert: function (value, record) {
				let arr = [
					{ value: record.get("afz"), text: record.get("dja") }, 
					{ value: record.get("bfz"), text: record.get("djb") }, 
					{ value: record.get("cfz"), text: record.get("djc") }, 
					{ value: record.get("dfz"), text: record.get("djd") }, 
					{ value: record.get("efz"), text: record.get("dje") }
				];
				return arr;
			} }
		],
		proxy: {
			type: "ajax", 
			url: "/student/jxpgdata", 
			reader: { 
				type: "json", 
				root: "data" 
			},
			api: {
				update: "/student/SaveJxpg" 
			}
        }
	});
	Ext.define("SctCoz.Student.Score", {
		extend: "Ext.data.Store",
		fields: [
			"dptno", "dptname", "spno", "spname", "bj", "grade", "stid", "name", 
			"term", "courseid", "courseno", "cname", "courselevel", "cid", "cno", 
			"score", "zpxs", "kctype", "typeno", "sycj", "qzcj", "pscj", "khcj", "zpcj", 
			"kslb", "cjlb", "kssj", "xf", "xslb", "tname1", 
			"stage", "examt", "xs", "cjlx", "chk", "comm"
		],
		proxy: {
			type: "ajax",
			url: "/Student/GetStuScore",
			reader: {
				type: "json",
				root: "data"
			}
		}
	});
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
	});
	Ext.define("SctCoz.Query.QueryForm", {
		extend: "Ext.form.Panel",
		xtype: ["query-form"],
		frame: true, layout: "fit", region: "north",
		fieldDefaults: { labelAlign: "right", labelWidth: 60, margin: "0 0 6 0" }, 
		viewConfig: { forceFit: true, stripeRows: true },
		items: [{
			xtype: "fieldset",
			title: "请输入查询条件，按查询键开始",
			layout: "column",
			defaultType: "textfield",
			margin: 0,
			items: this.argcols
		}],
		constructor: function (config) {
			Ext.apply(this, Ext.apply({}, config));
			this.argcols.push({ xtype: "button", text: "查询", margin: "0 3", formBind: true , handler: this.QueryByStore });
			this.items[0].items = this.argcols;
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
				Ext.ux.grid.Printer.mainTitle = title;
				Ext.ux.grid.Printer.print(me.up("grid"));
			}},
			{ xtype: "button", text: "导出表格", formBind: true, iconCls: "excel", handler: function printGrid(me, opt) {  
				let title = me.up("query-grid").printTitle;
				Ext.ux.grid.Printer.mainTitle = title;
				Ext.ux.grid.Printer.ToExcel(me.up("grid"));
			}}
		],
		constructor: function (config) {
			Ext.apply(this, Ext.apply({}, config));
			this.tbar = this.tbar.concat(config.newTbar);
			this.callParent(arguments);
		}
	});
	Ext.define("SctCoz.Query.SelectGrid", {
		extend: "Ext.grid.Panel",
		xtype: ["select-grid"],
		columnLines: true,
		width: "100%", height: "100%", minHeight: 400, layout: "fit", region: "center",
		plugins: [Ext.create("Ext.grid.plugin.CellEditing", { clicksToEdit: 1 })],
		viewConfig: { forceFit: true, stripeRows: true, enableTextSelection: true },
		features: [{ ftype: "grouping", id: "groupFea" }],
		selType: "checkboxmodel",
		selModel: { mode: "SINGLE" },
		tbar: [],
		constructor: function (config) {
			Ext.apply(this, Ext.apply({}, config));
			this.tbar = this.tbar.concat([
				{ xtype: "button", text: "提交", handler: config.SelectFn },
				{ xtype: "button", text: "抢课", handler: config.TakeFn }
			]);
			this.callParent(arguments);
		}
	});
	Ext.define("SctCoz.Query.Schedule", {
		extend: "Ext.panel.Panel", 
		xtype: ["query-schedule"],
		bodyPadding: 0, margin: 1, width:"100%", layout: "card",
		viewConfig: { forceFit: true },
		activeItem: 0,
		constructor: function (config) {
			Ext.apply(this, Ext.apply({}, config));
			// 组件
			var timeGridStore = Ext.create("SctCoz.Comm.HourInfo", { 
				fields: [
					"term", "nodeno", "xss", "nodename", "memo",
					"week1", "week2", "week3", "week4", "week5", "week6", "week7", 
				],
				autoLoad: false
			});
			// 直接从本地加载提高加载速度
			timeGridStore.loadRecords(Ext.data.StoreManager.lookup("SchoolHour").getRange());
			var timeGrid = Ext.create("SctCoz.Query.QueryGrid", {
				autoScroll: false, height: "100%",
				store: timeGridStore,
				columns: [
					{ header: "节次", dataIndex: "nodeno", minWidth: 64, fiex: 1, renderer: function (value, metaData, record) {
						let name = record.get("nodename");
						let time = record.get("memo");
						return name;
					}},
					{ header: "星期一", dataIndex: "week1", minWidth: 90, flex: 1 },
					{ header: "星期二", dataIndex: "week2", minWidth: 90, flex: 1 },
					{ header: "星期三", dataIndex: "week3", minWidth: 90, flex: 1 },
					{ header: "星期四", dataIndex: "week4", minWidth: 90, flex: 1 },
					{ header: "星期五", dataIndex: "week5", minWidth: 90, flex: 1 },
					{ header: "星期六", dataIndex: "week6", minWidth: 90, flex: 1 },
					{ header: "星期日", dataIndex: "week7", minWidth: 90, flex: 1 },
				]
			});
			// var infoGrid = Ext.create
			var form = Ext.create("Ext.form.Panel", {
				title: "课程信息",
				bodyPadding: 2, margin: 1, width: "100%", autoScroll: true,
				defaultType: "displayfield",
				fieldDefaults: { 
					labelSeparator: ":", 
					margin: 2, 
					labelAlign: "right", 
					labelWidth: 90, 
					anchor: "0" 
				},
				layout: { 
					type: "table", 
					columns: 5 
				}, // columns 规定每行列数
				viewConfig: { 
					forceFit: true, 
					stripeRows: true, 
				}
			});
			this.TimeStore =  Ext.create("SctCoz.Student.Schedule", {
				listeners: {
					load: function (me, records, success, opts) {
						// 清空
						form.removeAll(true);
						var recordsByTime = timeGridStore.getRange();
						recordsByTime.forEach(function (record, index , array) {
							record.set("week1", "");
							record.set("week2", "");
							record.set("week3", "");
							record.set("week4", "");
							record.set("week5", "");
							record.set("week6", "");
							record.set("week7", "");
						});
						timeGridStore.commitChanges();
						let flag;
						records.forEach(function (record, index , array) {
							// 载入form
							if (flag != record.get("courseno") ) {
								form.add([
									{ fieldLabel: "课程序号", labelWidth: 64, width: 110, value: record.get("courseno") }, 
									{ fieldLabel: "课程代码", labelWidth: 64, width: 140, value: record.get("courseid") }, 
									{ fieldLabel: "课程名称", labelWidth: 64, width: 250, value: record.get("cname") },
									{ fieldLabel: "教师姓名", labelWidth: 64, width: 150, value: record.get("name") }, 
									{ fieldLabel: "课程备注", labelWidth: 64, width: 250, value: record.get("comm") }
								]);
								flag = record.get("courseno");
							}
							// 载入grid
							let weekno = record.get("week");
							let seqno = record.get("sequence") - 1;
							let Text = recordsByTime[seqno].get("week" + weekno);
							Text = Text + record.get("cname") + "<br>";
							Text = Text + record.get("courseno") + "<br>";
							Text = Text + "(" + record.get("startweek") + "-" + record.get("endweek") + ")"; 
							Text = Text + (record.get("croomno") == null ? "" : record.get("croomno")) + "<br>";
							recordsByTime[seqno].set("week" + weekno, Text);
						});
						// 提交更改
						timeGridStore.commitChanges();
					}
				}
			});
			this.LoadSchedule = function (isAutoLoad, temp, title) {
				let form = this.down("[xtype='form']");
				let timeGrid = this.down("[xtype='query-grid']");
				
				if (isAutoLoad) {
					this.TimeStoresetProxy({
						type: "ajax",
						url: "/student/getstutable",
						reader: { 
							type: "json", 
							root: "data" 
						}
					});
					this.TimeStore.getProxy().extraParams.term = temp;
					this.TimeStore.load();
					timeGrid.printTitle = temp + " 课程表";
				} else {
					this.TimeStore.setProxy({
						type: "memory",
						data: {
							data: temp.map(function (record, index,array) {
								return record.getData();
							})
						},
						reader: { 
							type: "json",
							root: "data"
						}
					});
					this.TimeStore.load();
					timeGrid.printTitle = "排课表";
				}
			};
			this.items = [timeGrid, form];
			// 换页功能
			let navigate = function(button){
				let layout = button.up("[xtype='query-schedule']").getLayout();
				layout[button.direction]();
				Ext.getCmp("card-prev").setDisabled(!layout.getPrev());
				Ext.getCmp("card-next").setDisabled(!layout.getNext());
			};
			this.bbar = [{
				id: "card-prev",
				direction: "prev",
				text: "<< 时间表",
				handler: navigate,
				disabled: true
			}, "->", {
				id: "card-next",
				direction: "next",
				text: "课程信息 >>",
				handler: navigate,
			}];
			this.callParent(arguments);
		}
	});
	Ext.define("SctCoz.Query.CoursePlan", {
		extend: "Ext.data.Store",
		alias: ["CoursePlan"],
		fields: [
			"pid", "term", "spno", "grade", "courseid", "cname", "tname", 
			"examt", "xf", "llxs", "syxs", "qtxs", "sjxs", "type", "mustsct", "xjcl", "comm",
			{ name: "typeText", persist: false , convert: function (value, record) {
				let typeArray = [[0, "百分制"], [1, "五级制"], [2, "二级制"]];
				return typeArray[record.get("type")][1];
			}}
		],
		proxy: {
			url: "/Query/GetCoursePlan",
			type: "ajax",
			reader: {
				type: "json",
				root: "data"
			},
			extraParams: {
				term: "",
				grade: "",
				dptno: "",
				spno: "",
				courseid: "",
				plan: 0
			}
		}
	});
	Ext.define("SctCoz.Query.CourseSetTable", {
		extend: "Ext.data.Store",
		pageSize: 500,
		alias: ["CourseSetTable"],
		fields: [
			{ name: "sct", type: "boolean", defaultValue: true }, 
			"dptname", "spname", "grade", "cname", "courseno", "name", 
			"startweek", "endweek", "oddweek", "croomno", "week", "sequence", "term", 
			"courseid", "coment", "studentcount", "credithour", 
			"teachperiod", "labperiod", "copperiod", "maxperson"
		],
		filterOnLoad: true,
		// 用课号做分组依据方便后面处理, 但这样有问题
		// groupField: "courseno",
		proxy: {
			type: "ajax", url: "/Query/GetCourseTable",
			reader: { 
				type: "json", 
				root: "data" 
			},
			extraParams: {
				term: "",
				grade: "",
				dptno: "",
				spno: "",
				courseid: "",
				startweek: 0, endweek: 20,
				fromweek: 0, toweek: 7, 
				startsequence: 0, endsequence: 100, 
				croomno: "", 
				teacherno: "", tname: "",
				courseno: "", 
				courseid: "", 
				cname: "", 
				date: "",
				stid: "0000000000"
			}
		},
		autoLoad: false
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