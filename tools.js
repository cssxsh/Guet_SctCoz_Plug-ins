//这是一个接口库
//version 0.1.1

Ext.define('SctCoz.tools', {
	SysMenus: null,
	Menus_Tree: null,
	Panel: null,
	menuAdd: function (config) {
        console.log("add...");
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
		this.Panel.addListener("add", function () {
			var last = this.items.items[this.items.items.length - 1];
			if (config.action == last.id) {
				config.fn();
			}
		});
	},
	init: function () {
		//初始化
        console.log("init...");
		this.SysMenus = Ext.getCmp("SystemMenus");
		this.Menus_Tree = this.SysMenus.items.items[0].node;
		this.Panel = Ext.getCmp("content_panel");
	}
})

/*
menu_config = {
	action: "PanId",
	text: "text",
	id: "id",
	fn: function () {}
}
*/