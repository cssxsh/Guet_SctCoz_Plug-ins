//这是一个接口库
//version 0.1.5

Ext.define('SctCoz.tools', {
    config:{
		id: 'plug',
        version: "0.1.5",
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
		for (var i in this.newMenus) {
            console.log(id);
			if (this.newMenus[i].id == id) {
				var Listeners = {
					afterrender: this.newMenus[i].afterrender,
					activate: this.newMenus[i].activate
				};
				return Listeners;
			}
		}
		return null;
	}
	,
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
                listeners: {
                    afterrender: Listeners.afterrender || function (me, opts) {
                    },
                    activate: Listeners.activate || function (me, opts) {
                        if (me.barChange) {
                            me.barChange = false;
                            me.loader.load();
                        }
                    }
                }
            }).show();
        }
        else
            tabPanel.setActiveTab(tabNodeId);
    },
	init: function () {
		//初始化
        console.log("ver "+ this.version + "   initing...");
		this.SysMenus = Ext.getCmp("SystemMenus");
		this.Menus_Tree = this.SysMenus.items.items[0].node;
		this.SysMenus.openTab = this.newOpenTab;
	}
});

/*
menu_config = {
	action: "PanId",
	text: "text",
	id: "id",
	afterrender function () {},
	activate: function () {}
}
*/