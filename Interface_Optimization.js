// ==UserScript==
// @name         Interface Optimization
// @namespace    https://github.com/cssxsh/Guet_SctCoz_Plug-ins
// @version      0.1
// @description  对选课系统做一些优化
// @author       cssxsh
// @include      http://bkjw.guet.edu.cn/Login/MainDesktop
// @include      http://172.16.13.22/Login/MainDesktop
// @updateURL    https://github.com/cssxsh/Guet_SctCoz_Plug-ins/raw/master/Interface_Optimization.js
// @grant        none
// ==/UserScript==


//这个插件没有用通用方法
Ext.onReady(function () {
    //定义监视器
    var panel = Ext.getCmp("content_panel");

    panel.addListener("add", function () {
        var lastTab = panel.items.items[panel.items.items.length - 1];
        if (lastTab.id == "QryCourseSet") {
            //lastTab.items.items[0].items.items[0].items.items[0].items.items[0].add({width: 120, labelWidth: 35,  name: 'stid', fieldLabel: '学号'});
        }
        lastTab.addListener("beforeshow", function () {
            var gridArr = Ext.query(".x-grid-with-col-lines");
            for (var i in gridArr) {
                var g = Ext.getCmp(gridArr[i].id);
                console.log(Ext.getClassName(g));
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