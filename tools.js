//这是一个接口库
//version 0.2.0

Ext.define("SctCoz.tools", {
	config: {
		id: "plug",
		version: "0.2.2",
	},
	// XXX: 弄一个变量仓库专门管理常用全局变量
	ClassStorage: {
		//变量数组
		NewMenus: [],
		ValuesOfClass: [],

		//操作方法
		Save: function () {
			var type = arguments[0];
			var value = arguments[1];
			if (type == "menu") {
				this.NewMenus.push(value);
				var id = arguments[1].id;
				this.ValuesOfClass.push({ id, value });
			} else if (type == "value") {
				var id = arguments[2];
				this.ValuesOfClass.push({id, value});
			}
		},
		Get: function () {
			var type = arguments[0];
			var id = arguments[1];
			var value = null;
			if (type == "menu") {
				//返回第一个符合的菜单
				this.NewMenus.filter(function (item) { return item.id == id }).forEach(function (item) {
					value = item.value;
				});
			} else if (type == "value") {
				//返回第一个符合的变量
				this.ValuesOfClass.filter(function (item) { return item.id == id }).forEach(function (item) {
					value = item.value;
				});
			}
			return value;
		},
		Set: function () {
			var type = arguments[0];
			var id = arguments[1];
			var setdata = arguments[2];
			if (type == "menu") {
				//处理第一个符合的菜单
				this.NewMenus.filter(function (item) { return item.id == id }).forEach(setdata);
			} else if (type == "value") {
				//处理第一个符合的变量
				this.ValuesOfClass.filter(function (item) { return item.id == id }).forEach(setdata);
			}
		}
	},
	SysMenus: null,
	Menus_Tree: null,
	newMenus: [],
	menuAdd: function (config) {
		console.log(config.action + "add...");
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
		console.log(config.action + " change...");
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
		var Listeners = {};
		// this.newMenus.filter(function (item) { return item.id == id }).forEach(function (item) {
		// 	Listeners = item.listeners;
		// });
		this.ClassStorage.Set("menu", id, function (item) {
			console.log(item);
			Listeners = item.listeners;
		});

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
		var tabPanel = Ext.getCmp("content_panel");
		var tabNodeId = tabPanel.down("[id=' + actid + ']");
		var Listeners = plugTools.getNewListeners(actid);
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
	init: function () {
		//初始化
		console.log("ver " + this.version + "   initing...");
		this.SysMenus = Ext.getCmp("SystemMenus");
		this.Menus_Tree = this.SysMenus.down("treeview").node;
		//重载打开Tab的方法
		this.SysMenus.openTab = this.newOpenTab;
		Ext.Loader.setPath({
            SctCoz: "https://raw.githack.com/cssxsh/Guet_SctCoz_Plug-ins/master"
        });
	}
	// TODO: 写一些调试用组件
});

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