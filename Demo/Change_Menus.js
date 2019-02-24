// ==UserScript==
// @name         Change Menus
// @namespace    https://github.com/cssxsh/Guet_SctCoz_Plug-ins
// @version      0.1
// @description  修改系统菜单DEMO
// @author       cssxsh
// @include      http://bkjw.guet.edu.cn/Login/MainDesktop
// @include      http://172.16.13.22/Login/MainDesktop
// @updateURL    https://github.com/cssxsh/Guet_SctCoz_Plug-ins/raw/master/Demo/Change_Menus.js
// @grant        none
// ==/UserScript==

//获取菜单对象
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
        console.log(this.Menus_Tree.childNodes.length);
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
        console.log(this.Panel.items.items.length);
	}
})

//启动接口
Ext.onReady(function () {
	//获取菜单、菜单树对象
	var tools = Ext.create('SctCoz.tools');
	tools.init();
	var test = {
		action: "PanId",
		text: "text",
		id: "id",
		fn: function () {
			Ext.Msg.alert("OK!");
		}
	}
	tools.menuAdd(test);
});