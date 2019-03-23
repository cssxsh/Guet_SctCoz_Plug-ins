//这是一个接口库
//version 3.5
if (typeof SctCoz == "undefined") {//防止重复定义
	Ext.define("SctCoz.tools", {
		config: {
			id: "plug",
		},
		statics: {
			version: "3.5.1",
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
				let Listeners = (menu == null) ? {} : menu.listeners;
		
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
			// 新的启动模块函数, 用来配合menuChange使用
			newOpenTab: function (panel, id, text, actid) {
				let tabPanel = Ext.getCmp("content_panel");
				let tabNodeId = tabPanel.down("[id=' + actid + ']");
				let Listeners = SctCoz.tools.getNewListeners(actid);
				if (!tabNodeId) {
					tabPanel.add({
						id: actid,
						title: text,
						layout: "fit",
						closable: true,
						childActId: actid,
						barChange: false,
						loader: {
							url: panel,
							loadMask: "请稍等...",
							// FIXME: [5] <修改判断方式> {规范化} (添加一个新属性用于判断) 
							autoLoad: id != actid,
							scripts: true
						},
						listeners: Listeners
					}).show();
				}
				else {
					tabPanel.setActiveTab(tabNodeId);
				}
			},
			init: function (config) {
				// config 参数赋值
				if (typeof config != "undefined"){
					// this.id = config.id|"plug";
					this.debugLevel = typeof config.debugLevel == "undefined" ? this.debugLevel : config.debugLevel;
				}
				//初始化
				this.Logger("ver " + this.version + " initing...");
				this.SysMenus = Ext.getCmp("SystemMenus");
				this.Menus_Tree = this.SysMenus.down("treeview").node;
				//重载打开Tab的方法
				this.SysMenus.openTab = this.newOpenTab;
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
					method: config.method||"GET",
					// 数据选项， 仅在POST情况下生效
					data: config.data,
					// 默认加载path
					url: config.url||url,
					// arraybuffer, blob, json， 默认json
					responseType: config.type||"json",
					// 延迟上限， 默认3000ms
					outtime: config.timeout||3000,
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
							default :
								config.success(result.response);
							break;
						}
					}
				});
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
		afterrender function (me, opt) {},		//一般为修改模块使用，模块启动后执行
		activate: function (me, opt) {}		//一般为加载自定义模块使用，将覆盖原有加载方式，定义为空，则不覆盖
	}
}
*/