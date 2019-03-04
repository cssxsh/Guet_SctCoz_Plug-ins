//这是一个接口库
//version 0.1.7

Ext.define('SctCoz.tools', {
	config:{
		id: 'plug',
		version: "0.1.7",
	},
	// TODO: 弄一个变量仓库专门管理常用全局变量
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
		this.newMenus.push(config);
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
		this.newMenus.push(config);
	},
	getNewListeners: function (id) {
		var Listeners = {};
		this.newMenus.filter(function (item) { return item.id == id }).forEach(function (item) {
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
		var tabNodeId = tabPanel.down('[id=' + actid + ']');
		var Listeners = plugTools.getNewListeners(actid);
		if (!tabNodeId) {
			tabPanel.add({
				id: actid,
				title: text,
				layout:'fit',
				closable: true,
				childActId: actid,
				barChange: false,
				loader: {
					url: panel,
					loadMask: '请稍等...',
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
		console.log("ver "+ this.version + "   initing...");
		this.SysMenus = Ext.getCmp("SystemMenus");
		this.Menus_Tree = this.SysMenus.down("treeview").node;
		//重载打开Tab的方法
		this.SysMenus.openTab = this.newOpenTab;
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