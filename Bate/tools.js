//这是一个接口库
//version 0.2.0
if (typeof SctCoz == "undefined") {//防止重复定义
	Ext.define("SctCoz.tools", {
		config: {
			id: "plug",
		},
		statics: {
			version: "0.3.0",
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
						//返回符合的菜单
						// this.NewMenus.filter(function (item) { return item.id == id }).forEach(function (item) {
						// 	value = item.value;
						// });
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
			menuAdd: function (config) {
				// console.log(config.action + " add...");
				this.Logger(config.action + " add...");
				var menu_config = {
					"action": config.action,
					"children": null,
					"command": null,
					"controller": "plug",
					"id": config.id,
					"leaf": true,
					"text": config.text,
					"type": "action",
				};
				this.Menus_Tree.appendChild(menu_config);
				//this.newMenus.push(config);
				this.ClassStorage.Save("menu", config);
			},
			menuChange: function (config) {
				// console.log(config.action + " change...");
				this.Logger(config.action + " change...");
				var menu_config = {
					"action": config.action,
					"children": null,
					"command": null,
					"controller": "plug",
					"id": config.id,
					"leaf": true,
					"text": config.text,
					"type": "action",
				};
				//this.newMenus.push(config);
				this.ClassStorage.Save("menu", config);
			},
			getNewListeners: function (id) {
				//this.Logger(this.ClassStorage.Get("menu", id));
				let Listeners = this.ClassStorage.Get("menu", id).listeners;
		
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
							autoLoad: true,
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
				if (config != null){
					// this.id = config.id|"plug";
					this.debugLevel = config.debugLevel|this.debugLevel;
				}
				//初始化
				this.Logger("ver " + this.version + "   initing...");
				this.SysMenus = Ext.getCmp("SystemMenus");
				//this.Logger(this.SysMenus);
				this.Menus_Tree = this.SysMenus.down("treeview").node;
				//重载打开Tab的方法
				this.SysMenus.openTab = this.newOpenTab;
				Ext.Loader.setPath({
					SctCoz: "https://raw.githack.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate"
				});
				this.inited = true;
			},
			// 写一些调试用组件
			// 调试输出
			Logger: function (info, Level) {
				// 选择输出形式
				let prefix = "";
				let style = "";
				// 默认输出等级为1
				let level = Level|1;
				// 低于debug等级不输出
				if (level >= this.debugLevel) return;
				switch (level) {
					default :	// 默认等级与 level 0 一致
					case 0:
						console.log(info);
					break;		// 过程记录
					case 1:
						prefix = "@: ";
						style = "color: green;";
						console.log("%c" + prefix + info, style);
					break;		// 运行异常
					case 2:
						prefix = "$: ";
						style = "color: blue; font-size: 12px";
						console.log("%c" + prefix + info, style);
					break;		// 轻微警告
					case 3:
						prefix = "#: ";
						style = "color: yellow; font-size: 24px";
						console.log("%c" + prefix + info, style);
					break;		// 严重错误
					case 4:	
						prefix = "!: ";
						style = "color: red; font-size: 48px";
						console.log("%c" + prefix + info, style);
					break;
					case 5:		// 回滚代码
						prefix = "作者是个菜鸡！！！： ";
						style = "color: black; font-size: 96px";
						console.log("%c" + prefix + info, style);
					break;
				}
			},
			// XXX: 加载外部资源函数封装
			LoadData: function (config) {
				GM_xmlhttpRequest({
					// GET, HEAD, POST, 默认GET
					method: config.method|"GET",
					// 数据选项， 仅在POST情况下生效
					data: config.data,
					// 默认加载path
					url: config.url|("https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Json/" + config.path),
					// arraybuffer, blob, json， 默认json
					responseType: config.type|"json",
					// 延迟上限， 默认3000ms
					timeout: config.timeout|3000,
					// 加载失败的情况
					ontimeout: config.failure,
					onerror: config.failure,
					// 成功完成的情况
					onload: function (result) {
						switch (result.status) {
							case 404:
								config.failure(result);
							break;
							default :
								config.success(result.response);
							break;
						}
						config.success(result.response);
					}
					// 还有其他修改选项详情看文档
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