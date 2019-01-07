// ==UserScript==
// @name         Interface Optimization
// @namespace    https://github.com/cssxsh/Guet_SctCoz_Plug-ins
// @version      0.2.3
// @description  对选课系统做一些优化
// @author       cssxsh
// @include      http://bkjw.guet.edu.cn/Login/MainDesktop
// @include      http://172.16.13.22/Login/MainDesktop
// @updateURL    https://github.com/cssxsh/Guet_SctCoz_Plug-ins/raw/master/Interface_Optimization.js
// @grant        none
// ==/UserScript==

//启动接口
Ext.onReady(function () {
    //创建工具
    window.plugTools;
	if (window.plugTools == null) {
		window.plugTools = Ext.create("SctCoz.tools");
		plugTools.init();
	}
	var CourseSetNewButton = {
		action: "QryCourseSet",
		text: "课程设置",
		id: "QryCourseSet",
        listeners: {
            add: function (me, opt) {//这里用add方法不是很好，但是找不到合适的事件等待加载完毕
                //修正面板功能
                var qryfrm = me.down("fieldset"); //获取条件筛选面板
                qryfrm.add({width: 120, labelWidth: 35,  name: 'stid', fieldLabel: '学号'});
                var inputs = qryfrm.items.items;
                for (var i in inputs) {
                    if (inputs[i].xtype == 'combo') {
                        inputs[i].editable = true;
                    }
                }
                //修正排序功能
                var grid = me.down("grid");
                for (var j in grid.columns) {
                    grid.columns[j].sortable = true;
                }
                //添加日程表功能
                var ctb = Ext.create('Edu.view.coursetable');
                var toolTbar = grid.down("toolbar");// 获取工具栏
                toolTbar.add({ xtype: 'button', text: '转为课表', formBind: true, icon: '/images/0775.gif', handler: openTimeTable});
                function openTimeTable (me, opt) {
                    var grid = me.up("grid");
                    var gRec = grid.getStore().data.items;
                    var panView = Ext.create('Ext.panel.Panel', {layout: 'fit', autoScroll: true, frame: true});
                    Ext.create("Ext.window.Window", {
                        title: "课程表",
                        width: '80%', height:'80%',modal: true, resizable: false, layout: 'border',
                        items: [panView]
                    }).show();
                    ctb.render(panView.body, gRec);
                }
            },
            activate: null
        }
	}
    plugTools.menuChange(CourseSetNewButton);

	//这里没有用通用方法
    //定义监视器
    var panel = Ext.getCmp("content_panel");
    panel.addListener("add", function () {
        var lastTab = panel.items.items[panel.items.items.length - 1];
        lastTab.addListener("add", function () {
            var gridArr = Ext.query(".x-grid-with-col-lines");
            for (var i in gridArr) {
                var g = Ext.getCmp(gridArr[i].id);
                //console.log(Ext.getClassName(g));
                if (Ext.getClassName(g) == "Ext.grid.Panel" || Ext.getClassName(g) == "Edu.view.ShowGrid") {
                    //console.log(g.id);
                    for (var j in g.columns) {
                        g.columns[j].sortable = true;
                    }
                }
            }
        });
    });

});

Ext.define('SctCoz.tools', {
    config:{
		id: 'plug',
        version: "0.1.6",
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
            //console.log(id);
			if (this.newMenus[i].id == id) {
				var Listeners = this.newMenus[i].listeners;
				if (Listeners.activate == null) {
					Listeners.activate = function (me, opts) {
                        if (me.barChange) {
                            me.barChange = false;
                            me.loader.load();
                        }
					}
				}
				return Listeners;
			}
		}
		return {};
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
                listeners: Listeners
            }).show();
        }
        else
            tabPanel.setActiveTab(tabNodeId);
    },
	init: function () {
		//初始化
        console.log("ver "+ this.version + "   initing...");
		this.SysMenus = Ext.getCmp("SystemMenus");
		this.Menus_Tree = this.SysMenus.down("treeview").node;
		this.SysMenus.openTab = this.newOpenTab;
	}
});