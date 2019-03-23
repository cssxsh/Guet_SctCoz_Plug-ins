// ==UserScript==
// @name         Repair Bug
// @namespace    https://github.com/cssxsh/Guet_SctCoz_Plug-ins
// @version      1.1.1
// @description  修补选课系统的bug
// @author       cssxsh
// @include      http://bkjw.guet.edu.cn/Login/MainDesktop
// @include      http://172.16.13.22/Login/MainDesktop
// @updateURL    https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate/Repair_Bug.js
// @installURL   https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate/Repair_Bug.js
// @downloadURL  https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate/Repair_Bug.js
// @suppertURL   https://github.com/cssxsh/Guet_SctCoz_Plug-ins/issues
// @license      MIT
// @run-at       document-end
// @connect      raw.githubusercontent.com
// @connect      experiment.guet.edu.cn
// @grant        GM_xmlhttpRequest
// @grant		 GM_deleteValue
// @grant		 GM_listValues
// @grant		 GM_addValueChangeListener
// @grant		 GM_removeValueChangeListener
// @grant		 GM_setValue
// @grant		 GM_getValue
// ==/UserScript==

"use strict";

// 启动接口
Ext.onReady(function () {

    // 创建工具
	let plugTools = SctCoz.tools;
	if (!plugTools.inited) plugTools.init({ debugLevel: 0 });
    
    // 创建并应用修改
    let StuPersonNew = {
		action: "StuPerson",
		text: "个人信息",
		id: "StuPerson",
		listeners: {
            afterrender: function (me, opt) {
                Ext.QuickTips.init();
                Ext.form.Field.prototype.MsgTarget = "side";
        
                let spnosto = Ext.data.StoreManager.lookup("spSto");
                let zt = [["1", "居民身份证"], ["6", "香港特区护照/身份证明"], ["7", "澳门特区护照/身份证明"], ["8", "台湾居民来往大陆通行证"], ["9", "境外永久居住证"], ["A", "护照"], ["C", "港澳台居民居住证"]];
                let frm = Ext.create("Ext.form.Panel", {
                    url: "/Student/GetPerson",
                    method: "post",
                    frame: true,
                    bodypadding: "2",
                    defaultType:"displayfield",
                    fieldDefaults: { labelSeparator: ":", margin: 2, labelAlign: "right", hideEmptyLabel: true, labelWidth: 90, anchor: "0" },
                    layout: { type: "table", columns: 4 }, 
                    viewConfig: { forceFit: true, stripeRows: true, }, 
                    region: "center",
                    items: [
                        { xtype: "hidden", name: "oldno" },
                        { fieldLabel: "专业", name: "spno", xtype: "combo", readOnly: true, editable: false,  store: spnosto, displayField: "text", valueField: "spno", allowBlank: false },
                        { fieldLabel: "年级", name: "grade", width: 140 },
                        { fieldLabel: "班级", name: "classno",width: 140 },
                        { fieldLabel: "学号", name: "stid", width: 160 },
                        { fieldLabel: "状态", name: "changetype", width: 140 },
                        { fieldLabel: "姓名", name: "name", width: 150 },
                        { fieldLabel: "性别", name: "sex", width: 110 },
                        // { fieldLabel: "曾用名", name: "name1" },
                        { fieldLabel: "民族", name: "nation", width: 120 },
                        { fieldLabel: "政治面貌", name: "political", width: 120 },
                        { fieldLabel: "入党日期", readOnly: true, name: "rdrq", renderer: ShowFormatDate },
                        { fieldLabel: "籍贯", name: "nativeplace", width: 120 },
                        { fieldLabel: "生日", readOnly: true, name: "birthday", renderer: ShowFormatDate },
                        { fieldLabel: "身份证号", name: "idcard", width: 180 },
                        { fieldLabel: "入学日期", readOnly: true, name: "enrolldate", renderer: ShowFormatDate },
                        { fieldLabel: "宿舍", name: "hostel", width: 120 },
                        { fieldLabel: "联系电话", name: "hostelphone", width: 120 },
                        { fieldLabel: "生源地市", name: "ds", width: 120 },
                        { fieldLabel: "学生类型", name: "stype", width: 120, colspan: 3},
                        { fieldLabel: "父母或监护人1", name: "fmxm1",width: 160 },
                        { fieldLabel: "证件类型", name: "fmzjlx1", store:zt, width: 220 },
                        { fieldLabel: "证件编码", name: "fmzjhm1", width: 210, colspan: 2},
                        { fieldLabel: "父母或监护人2", name: "fmxm2", width: 160 },
                        { fieldLabel: "证件类型", name: "fmzjlx2", store: zt, width: 220 },
                        { fieldLabel: "证件编码", name: "fmzjhm2", width: 210, colspan: 2} 
                    ]
                });
                frm.load();
                var pan = Ext.create("Edu.view.ShowPanel", {
                    title: "学生信息",
                    items: [frm]
                });
                me.add(pan);
            }
        }
    }
    let StuLabNew = {
		action: "StuLab",
		text: "实验成绩",
        id: "StuLab",
        listeners: {
            add: function (me, opt) {
                let grid = me.down("grid");
                grid.columns[4].dataIndex = "grade";
            }
        }
    }
    let StuLvlNew = {
        action: "StuLvl",
        text: "等级考试查询",
        id: "StuLvl",
        listeners: {
            add: function (me, opt) {
                // 修正Grid功能
				let grid = me.down("grid");
                grid.columns[2].dataIndex = "sex";
                // plugTools.Logger(me, 2, "info");
            }
        }
    }
    plugTools.menuChange(StuPersonNew);
    plugTools.menuChange(StuLabNew);
    plugTools.menuChange(StuLvlNew);
});