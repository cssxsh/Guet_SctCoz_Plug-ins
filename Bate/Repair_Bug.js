// ==UserScript==
// @name         Repair Bug
// @namespace    https://github.com/cssxsh/Guet_SctCoz_Plug-ins
// @version      1.3.0
// @description  修补选课系统的bug
// @author       cssxsh
// @include      http://bkjw.guet.edu.cn/Login/MainDesktop
// @include      http://172.16.13.22/Login/MainDesktop
// @updateURL    https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate/Repair_Bug.js
// @installURL   https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate/Repair_Bug.js
// @downloadURL  https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate/Repair_Bug.js
// @suppertURL   https://github.com/cssxsh/Guet_SctCoz_Plug-ins/issues
// @require      https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/Bate/tools.js
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

                let spSto = Ext.data.StoreManager.lookup("spSto");
                let zt = [["1", "居民身份证"], ["6", "香港特区护照/身份证明"], ["7", "澳门特区护照/身份证明"], ["8", "台湾居民来往大陆通行证"], ["9", "境外永久居住证"], ["A", "护照"], ["C", "港澳台居民居住证"]];
                let frm = Ext.create("Ext.form.Panel", {
                    url: "/Student/GetPerson",
                    method: "post",
                    frame: true,
                    bodypadding: "2",
                    defaultType: "displayfield",
                    fieldDefaults: { labelSeparator: ":", margin: 2, labelAlign: "right", hideEmptyLabel: true, labelWidth: 90, anchor: "0" },
                    layout: { type: "table", columns: 6 },
                    viewConfig: { forceFit: true, stripeRows: true, },
                    region: "center",
                    items: [
                        { xtype: "hidden", name: "oldno" },
                        // 第一行
                        { fieldLabel: "专业", name: "spno", width: 180, renderer: function (v) { return sctDropDown(v, spSto, "spno", "spname"); } },
                        { fieldLabel: "年级", name: "grade", width: 140 },
                        { fieldLabel: "班级", name: "classno", width: 140 },
                        { fieldLabel: "学号", name: "stid", width: 160 },
                        { fieldLabel: "状态", name: "changetype", width: 140 },
                        { fieldLabel: "入学日期", readOnly: true, name: "enrolldate", renderer: ShowFormatDate },
                        // 第二行
                        { fieldLabel: "姓名", name: "name", width: 150 },
                        { fieldLabel: "性别", name: "sex", width: 110 },
                        { fieldLabel: "生日", readOnly: true, name: "birthday", renderer: ShowFormatDate },
                        { fieldLabel: "身份证号", name: "idcard", width: 180 },
                        { fieldLabel: "民族", name: "nation", width: 120 },
                        { fieldLabel: "籍贯", name: "nativeplace", width: 120 },
                        // 第三行
                        { fieldLabel: "生源地市", name: "ds", width: 120 },
                        { fieldLabel: "邮编", name: "postcode", width: 120 },
                        { fieldLabel: "地址", name: "address", colspan: 2 },
                        { fieldLabel: "档案号", name: "dossiercode", width: 180 },
                        { fieldLabel: "学生类型", name: "stype", width: 120 },
                        // 第四行
                        { fieldLabel: "宿舍", name: "hostel", width: 120 },
                        { fieldLabel: "联系电话", name: "hostelphone", width: 120 },
                        { fieldLabel: "政治面貌", name: "political", width: 120 },
                        { fieldLabel: "入党日期", readOnly: true, name: "rdrq", renderer: ShowFormatDate, colspan: 3 },
                        // 第五行
                        { fieldLabel: "父母或监护人1", name: "fmxm1", width: 160 },
                        { fieldLabel: "证件类型", name: "fmzjlx1", store: zt, width: 220 },
                        { fieldLabel: "证件编码", name: "fmzjhm1", width: 210, colspan: 4 },
                        // 第六行
                        { fieldLabel: "父母或监护人2", name: "fmxm2", width: 160 },
                        { fieldLabel: "证件类型", name: "fmzjlx2", store: zt, width: 220 },
                        { fieldLabel: "证件编码", name: "fmzjhm2", width: 210, colspan: 4 }
                    ]
                });
                frm.load();
                var pan = Ext.create("Edu.view.ShowPanel", {
                    title: "学生信息",
                    items: [frm]
                });
                me.add(pan);
            }
        },
        isAutoLoad: false
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
        },
        isAutoLoad: true
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
            }
        },
        isAutoLoad: true
    }
    let StuDelayNew = {
        action: "StuDelay",
        text: "缓考申请",
        id: "StuDelay",
        listeners: {
            afterrender: function (me, opt) {
                let tmSto = Ext.data.StoreManager.lookup("xqSto");
                let dlSto = Ext.create("Ext.data.Store", {
                    fields: ["term", "grade", "spno", "courseid", "courseno", "cname", "stid", "name", "stype", "zt", "lb", "dptno", "reason"],
                    proxy: {
                        type: "ajax",
                        url: "/student/getstudelay",
                        api: {
                            create: "/student/adddelay",
                            update: "/student/chgdelay",
                            destroy: "/student/deldelay"
                        },
                        reader: {
                            type: "json",
                            root: "data"
                        }
                    }
                });
                let cnoSto = Ext.create("Ext.data.Store", {
                    fields: ["id", "term", "courseno", "stid", "cname", "xf", "name", "tname", "xm", "xksj", "courseid", "stype", "ip", "xf", { name: "comm", defaultValue: "1@1" }],
                    proxy: {
                        type: "ajax",
                        url: "/student/GetSctCourse",
                        reader: {
                            type: "json",
                            root: "data"
                        }
                    }
                });
                let ztAry = ["未提交", "已提交", "审核通过", "不通过"];
                var qryfrm = Ext.create("Edu.view.QueryForm", {
                    url: "/student/stuinfo",
                    labelWidth: 60,
                    region: "north",
                    argcols: [
                        { xtype: "hidden", name: "comm", value: "1@1" }, // 让集体选课不被过滤
                        { xtype: "termcombo", name: "term", store: tmSto, allowBlank: false, labelWidth: 35 },
                        { xtype: "button", text: "查询", formBind: true, margin: "0 3", handler: queryStore }
                    ]
                });
                qryfrm.load();
                var dlGd = Ext.create("Edu.view.ShowGrid", {
                    region: "center",
                    width: "50%",
                    plugins: [Ext.create("Ext.grid.plugin.CellEditing", { clicksToEdit: 1 })],
                    store: dlSto,
                    columns: [
                        {
                            xtype: "actionrendercolumn", header: "操作", width: 70, 
                            renderer: function (v, m, r) { return (r.data.zt == 0) ? ["提交", "删除"] : []; },
                            items: [{
                                handler: function (grid, rowIndex, colIndex) {
                                    let sto = grid.getStore();
                                    let rec = sto.getAt(rowIndex);
                                    if (rec.get("zt") == 0) {
                                        let ly = rec.get("reason");
                                        if (!ly || ly.trim().length < 4) return Ext.Msg.alert("提示", "必须输入缓考理由");
                                        rec.set("zt", 1);
                                        sto.sync();
                                        return;
                                    }
                                }
                            }, {
                                handler: function (grid, rowIndex, colIndex) {
                                    let sto = grid.getStore();
                                    let rec = sto.getAt(rowIndex);
                                    if (rec.get("zt") == 0) {
                                        sto.remove(rec);
                                        sto.sync();
                                        return;
                                    }
                                }
                            }]
                        },
                        { header: "姓名", dataIndex: "name", width: 60 },
                        { header: "课号", dataIndex: "courseno", width: 65 },
                        { header: "课程名称", dataIndex: "cname", width: 120 },
                        { header: "状态", dataIndex: "zt", width: 50, renderer: function (v) { if (!v) v = 0; if (v >= 0 && v < 4) return ztAry[v]; } },
                        { header: "申请缓考理由", dataIndex: "reason", minWidth: 180, flex: 1, editor: {} }
                    ]
                });
                var grid = Ext.create("Edu.view.ShowGrid", {
                    region: "east",
                    width: "50%",
                    store: cnoSto,
                    tbar: [{ text: "添加", handler: addXk }],
                    columns: [
                        { header: "序号", xtype: "rownumberer", width: 30 },
                        { header: "课号", dataIndex: "courseno", width: 65 },
                        { header: "课程代码", dataIndex: "courseid", width: 90 },
                        { header: "课程名称", dataIndex: "cname", width: 180 },
                        { header: "学分", dataIndex: "xf", width: 45 },
                        { header: "课程性质", dataIndex: "tname", width: 70 }
                    ]
                });

                function queryStore() {
                    let args = qryfrm.getForm().getValues();
                    cnoSto.proxy.extraParams = args;
                    dlSto.proxy.extraParams = args;
                    cnoSto.load();
                    dlSto.load();
                }
                function addXk() {
                    let rs = grid.getSelectionModel().getSelection();
                    if (rs.length < 1) Ext.Msg.alert("请选择学生");
                    let qm = qryfrm.getValues();
                    rs.forEach(function (m) {
                        let nr = new dlSto.model();
                        Ext.apply(nr.data, m.data, qm);
                        m.set("zt", 0);
                        dlSto.add(nr);
                    });
                    dlSto.sync();
                }

                let pan = Ext.create("Edu.view.ShowPanel", {
                    items: [qryfrm, dlGd, grid]
                });
                me.add(pan);

                // 隐藏多余的旧模块
                me.addListener("add", function (me, newPan, opt) {
                    newPan.hide();
                });
            }
        },
        isAutoLoad: false
    }
    plugTools.menuChange(StuPersonNew);
    // plugTools.menuChange(StuLabNew);
    // plugTools.menuChange(StuLvlNew);
    plugTools.menuChange(StuDelayNew);
});