// ==UserScript==
// @name         Interface Optimization
// @namespace    https://github.com/cssxsh/Guet_SctCoz_Plug-ins
// @version      0.2
// @description  ��ѡ��ϵͳ��һЩ�Ż�
// @author       cssxsh
// @include      http://bkjw.guet.edu.cn/Login/MainDesktop
// @include      http://172.16.13.22/Login/MainDesktop
// @updateURL    https://github.com/cssxsh/Guet_SctCoz_Plug-ins/raw/master/Interface_Optimization.js
// @grant        none
// ==/UserScript==

//�����ӿ�
Ext.onReady(function () {
    //��������
    window.plugTools;
	if (window.plugTools == null) {
		window.plugTools = Ext.create("SctCoz.tools");
		plugTools.init();
	}
	var CourseSetNewButton = {
		action: "QryCourseSet",
		text: "�γ�����",
		id: "QryCourseSet",
        listeners: {
            add: function (me, opt) {//������add�������Ǻܺã������Ҳ������ʵ��¼��ȴ��������
                me.items.items[0].items.items[0].items.items[0].items.items[0].add({width: 120, labelWidth: 35,  name: 'stid', fieldLabel: 'ѧ��'})
                console.log(me.items.items.length);
            },
            activate: null
        }
	}
    plugTools.menuChange(CourseSetNewButton);

	//����û����ͨ�÷���
    //���������
    var panel = Ext.getCmp("content_panel");
    panel.addListener("add", function () {
        var lastTab = panel.items.items[panel.items.items.length - 1];
        if (lastTab.id == "QryCourseSet") {
            //lastTab.items.items[0].items.items[0].items.items[0].items.items[0].add({width: 120, labelWidth: 35,  name: 'stid', fieldLabel: 'ѧ��'});
        }
        lastTab.addListener("beforeshow", function () {
            var gridArr = Ext.query(".x-grid-with-col-lines");
            for (var i in gridArr) {
                var g = Ext.getCmp(gridArr[i].id);
                //console.log(Ext.getClassName(g));
                if (Ext.getClassName(g) == "Ext.grid.Panel" ||Ext.getClassName(g) == "Edu.view.ShowGrid") {
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
					loadMask: '���Ե�...',
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
		//��ʼ��
        console.log("ver "+ this.version + "   initing...");
		this.SysMenus = Ext.getCmp("SystemMenus");
		this.Menus_Tree = this.SysMenus.items.items[0].node;
		this.SysMenus.openTab = this.newOpenTab;
	}
});