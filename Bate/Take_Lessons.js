// ==UserScript==
// @name         Take Lessons
// @namespace    https://github.com/cssxsh/Guet_SctCoz_Plug-ins
// @version      4.7.10
// @description  新教务抢课脚本
// @author       cssxsh
// @include      http://bkjw.guet.edu.cn/Login/MainDesktop
// @include      http://172.16.13.22/Login/MainDesktop
// @updateURL    https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate/Take_Lessons.js
// @installURL   https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate/Take_Lessons.js
// @downloadURL  https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate/Take_Lessons.js
// @suppertURL   https://github.com/cssxsh/Guet_SctCoz_Plug-ins/issues
// @require      https://raw.githubusercontent.com/cssxsh/Guet_SctCoz_Plug-ins/master/Bate/tools.js
// @license      MIT
// @run-at       document-end
// @connect      raw.githubusercontent.com
// @connect      experiment.guet.edu.cn
// @grant        GM_xmlhttpRequest
// @grant		 GM_deconsteValue
// @grant		 GM_listValues
// @grant		 GM_addValueChangeListener
// @grant		 GM_removeValueChangeListener
// @grant		 GM_setValue
// @grant		 GM_getValue
// ==/UserScript==

"use strict";

const Rreplace_StuSct = (me) => {
    // 判断模块是否符合
    let SctType = "";
    switch (me.id) {
        case "StuSct":
            SctType = "正常";
            break;
        case "StuSctCx":
            SctType = "重修";
            break;
        default:
            // 不符合要求退出
            SctCoz.tools.Logger("类型错误：" + me.id, 2, "By Rreplace_StuSct");
            return;
    }
    //
    Ext.QuickTips.init();
    Ext.form.Field.prototype.MsgTarget = "side";
    // 控制参数
    const ClassStorage = SctCoz.tools.ClassStorage;
    const ctrl = ClassStorage.Load("value", me.id + "Crtl", {
        time: 1000, // 抢课时间间隔，单位毫秒
        old_hide: true, // 旧模块是否隐藏
        overflow: false, // 关闭以课程人数已满为继续抢课条件
        all: true, // 开启全课号
        term_optional: false // 学期是否可选
    });

    const queryByStore = (button) => {
        const panel = button.up("[xtype='query-panel']");
        const grid = panel.down("[xtype='query-grid']");
        const store = grid.getStore();
        const formSet = panel.down("[xtype='query-form']").getForm();
        const params = formSet.getValues();

        store.getProxy().extraParams = params;
        const term = formSet.findField("term").getDisplayValue();
        const spno = formSet.findField("spno").getDisplayValue();
        const grade = formSet.findField("grade").getDisplayValue();
        grid.printTitle = term + " " + grade + "级 " + spno + " 可选课程";
        store.load();
    };
    const queryForm = Ext.create("SctCoz.Query.QueryForm", {
        argcols: [
            {
                fieldLabel: "开课学期",
                xtype: "TermCombo",
                readOnly: ctrl.term_optional,
                value: SctCoz.Comm.getSctCozTerm()
            },
            {
                fieldLabel: "开课年级",
                xtype: "GradesCombo",
                allowBlank: false
            },
            {
                fieldLabel: "开课学院",
                xtype: "CollegeCombo",
                allowBlank: false
            },
            {
                fieldLabel: "开课专业",
                xtype: "MajorCombo",
                allowBlank: false
            },
            {
                fieldLabel: "选课类别",
                xtype: "hidden",
                name: "stype",
                value: SctType
            }
        ],
        QueryByStore: queryByStore
    });
    const user = SctCoz.Student.getUserInfo();
    // 用户信息里有stype会覆盖
    user.stype = SctType;
    queryForm.getForm().setValues(user);

    const loadCourseNo = (record) => {
        sctStore.removeAll();
        sctGrid.SelectRecord = record;
        const selfMajor = record.get("spno");
        const cname = record.get("cname");
        const courseid = record.get("courseid");
        // const col = SctCoz.tools.ClassStorage.Load("value", "T_L_Col");

        // XXX: [3] <优化性能问题> {解决性能问题} (调整获取课程计划的时间)
        if (ctrl.all) {
            sctGrid.selfMajor = selfMajor;
            const records = newStore.AllQueryStore.getGroups().find((item) => item.name === courseid).children;
            records.forEach((record) => {
                sctStore.getProxy().extraParams.id = record.get("pid");
                sctStore.load({ addRecords: true });
            });
            //
        } else {
            sctStore.getProxy().extraParams = record.data;
            sctStore.load();
        }
        sctGrid.setTitle(cname + "[" + courseid + "]");
        // 按钮分情况显示
        // 选了课之后就不会再回弹课号了
        // sctGrid.down("[action='select']").setVisible(!record.get("scted"));
        // sctGrid.down("[action='take']").setVisible(!record.get("scted"));
    };
    const selectCourse = (button) => {
        const grid = button.up("[xtype='select-grid']");
        const SctRecord = grid.getSelectionModel().getLastSelected();

        if (SctRecord !== null) {
            const params = SctRecord.getData();
            params.stype = SctType;
            Ext.Ajax.request({
                url: "/student/SctSave", // 保存选课记录接口
                params: params,
                method: "POST",
                success: (response) => {
                    const result = Ext.decode(response.responseText);
                    if (result.success) {
                        Ext.Msg.alert("成功", result.msg, () => {
                            SctRecord.set("scted", true);
                            SctRecord.commit();
                            loadCourseNo(SctRecord);
                        });
                    } else {
                        Ext.Msg.alert("失败", result.msg);
                    }
                },
                failure: (response) => {
                    Ext.Msg.alert("网络错误", response.status + ": " + response.statusText);
                }
            });
        } else {
            Ext.Msg.alert("提示", "请选择一个课号提交。");
        }
    };
    const takeCourse = (button) => {
        const grid = button.up("[xtype='select-grid']");
        const SctRecord = grid.getSelectionModel().getLastSelected();
        // const col = SctCoz.tools.ClassStorage.Load("value", "T_L_Col");
        if (SctRecord !== null) {
            const params = SctRecord.getData();
            params.stype = SctType;
            // SctCoz.tools.Logger("抢课开始，课号：" + params.courseno, 2, "By takeCourse");
            const task = {
                run: () => {
                    Ext.Ajax.request({
                        url: "/student/SctSave", // 保存选课记录接口
                        params: params,
                        method: "POST",
                        success: (response) => {
                            const result = Ext.decode(response.responseText);
                            // const overflow = window.SctCoz.tools.ClassStorage.Get("value", "StuSctCol");
                            if (result.success) {
                                Ext.TaskManager.stop(task);
                                Ext.Msg.hide();
                                Ext.Msg.alert("成功", result.msg, () => {
                                    SctRecord.set("scted", true);
                                    SctRecord.commit();
                                    loadCourseNo(SctRecord);
                                    // SctCoz.tools.Logger("抢课结束，课号：" + params.courseno, 2, "By takeCourse");
                                });
                                // 下面这句判断应该用正则表达式
                                // TODO: [8] <添加更多条件> {除了选课人数满应该还有其他条件}
                            } else if ("课程:" + params.courseno + "选择失败，选课人数已满!" === result.msg || ctrl.overflow) {
                                Ext.Msg.updateProgress((Ext.TaskManager.timerId % 100) / 100);
                                // SctCoz.tools.Logger("抢课进行中，课号：" + params.courseno, 2, "By takeCourse");
                            } else {
                                Ext.TaskManager.stop(task);
                                Ext.Msg.hide();
                                Ext.Msg.alert("错误", result.msg);
                            }
                        },
                        failure: (response) => {
                            Ext.TaskManager.stop(task);
                            Ext.Msg.hide();
                            Ext.Msg.alert("网络错误", response.status + ": " + response.statusText);
                        }
                    });
                },
                interval: ctrl.time
            };
            Ext.TaskManager.start(task);
            Ext.Msg.show({
                title: "提示",
                msg: "点击提示框左上角停止选课。",
                icon: Ext.Msg.INFO,
                closable: true, // Ext控件好像没有办法同时显示进度框和按钮
                progress: true,
                progressText: "课号: " + params.courseno + " 正在抢课！",
                fn: () => {
                    Ext.TaskManager.stop(task);
                }
            });
        } else {
            Ext.Msg.alert("提示", "请选择一个课号提交。");
        }
    };
    const newStore = Ext.create("SctCoz.Student.CoursePlan", {
        AllQueryStore: Ext.create("SctCoz.Query.CoursePlan", {
            // 方便之后使用
            groupField: "courseid"
        }),
        listeners: {
            // 加载课程计划
            load: (store, records) => {
                // const col = SctCoz.tools.ClassStorage.Load("value", "T_L_Col");
                if (ctrl.all) {
                    store.AllQueryStore.removeAll();
                    const loadMask = queryGrid.setLoading("全课号信息加载中...");
                    records.forEach((record) => {
                        const params = {
                            term: record.get("term"),
                            courseid: record.get("courseid")
                        };
                        store.AllQueryStore.getProxy().extraParams = params;
                        store.AllQueryStore.load({ addRecords: true });
                    });
                    loadMask.hide();
                }
            }
        }
    });
    const queryGrid = Ext.create("SctCoz.Query.QueryGrid", {
        store: newStore,
        width: "43%",
        columns: [
            { header: "序号", xtype: "rownumberer", width: 40 },
            {
                header: "操作",
                xtype: "actionrendercolumn",
                dataIndex: "scted",
                width: 48,
                renderer: (scted) => (scted ? ["查询"] : ["选课"]),
                items: [
                    {
                        handler: (grid, rowIndex) => {
                            const record = grid.getStore().getAt(rowIndex);
                            loadCourseNo(record);
                        }
                    }
                ]
            },
            { dataIndex: "scted", header: "已选", xtype: "booleancolumn", trueText: "是", falseText: "否", width: 40 },
            { header: "课程代码", dataIndex: "courseid", width: 95 },
            { header: "课程名称", dataIndex: "cname", width: 160 },
            { header: "课程性质", dataIndex: "tname", minWidth: 60 },
            { header: "学分", dataIndex: "xf", width: 45 }
        ]
    });
    const sctStore = Ext.create("SctCoz.Student.CourseSetNo", {
        groupField: "spno"
    });
    const feature = {
        ftype: "groupingsummary",
        groupHeaderTpl: [
            "<div>[{children:this.formatText}]共{children.length}个课号</div>",
            {
                formatText: function (records) {
                    const spno = records[0].get("spno");
                    let text = SctCoz.tools.transvalue(spno, "MajorNoStore", "spno", "text");
                    if (spno === this.owner.grid.selfMajor) {
                        // 本专业突出显示
                        text = "<span style='color:red;'>" + text + "</span>";
                    }
                    return text;
                }
            }
        ]
    };
    const sctGrid = Ext.create("SctCoz.Query.SelectGrid", {
        store: sctStore,
        region: "east",
        width: "56%",
        title: "请选择课程进行查询",
        features: [feature],
        columns: [
            { header: "课程序号", dataIndex: "courseno", width: 70 },
            { header: "容量", dataIndex: "maxstu", width: 56 },
            { header: "已选", dataIndex: "sctcnt", width: 48 },
            { header: "抽签", dataIndex: "lot", width: 48, xtype: "booleancolumn", trueText: "是", falseText: "否" },
            { header: "教师", dataIndex: "name", width: 72 },
            { header: "时间安排", dataIndex: "ap", width: 96, flex: 1 }
        ],
        buttonHandler: {
            SelectFn: selectCourse,
            TakeFn: takeCourse
        }
    });

    const panel = Ext.create("SctCoz.Query.QueryPanel", {
        Titconstext: "学生" + SctType + "选课【插件模式】",
        items: [queryForm, queryGrid, sctGrid]
    });
    me.add(panel);
};
// 创建修改并应用
const StuSctNew = {
    action: "StuSct",
    text: "选课【插件】",
    id: "StuSct",
    listeners: {
        afterrender: Rreplace_StuSct
    },
    isAutoLoad: false
};
const StuSctCxNew = {
    action: "StuSctCx",
    text: "重学选课【插件】",
    id: "StuSctCx",
    listeners: {
        afterrender: Rreplace_StuSct
    },
    isAutoLoad: false
};
const LabSctNew = {
    action: "LabSct",
    controller: "Plug-in",
    id: "LabSct",
    leaf: true,
    text: "实验选课【插件】",
    type: "action",
    isAutoLoad: false,
    listeners: {
        afterrender: (me) => {
            Ext.QuickTips.init();
            Ext.form.Field.prototype.MsgTarget = "side";
            // 实验查询
            const queryByStore = (button) => {
                const panel = button.up("[xtype='query-panel']");
                const grid = panel.down("[xtype='query-grid']");
                const store = grid.getStore();
                const formSet = panel.down("[xtype='query-form']").getForm();
                const params = formSet.getValues();

                store.getProxy().extraParams = params;
                const term = formSet.findField("term").getDisplayValue();
                const spno = formSet.findField("spno").getDisplayValue();
                const grade = formSet.findField("grade").getDisplayValue();
                grid.printTitle = term + " " + grade + "级 " + spno + " 实验计划";
                store.load();
            };
            const queryForm = Ext.create("SctCoz.Query.QueryForm", {
                argcols: [
                    {
                        fieldLabel: "开课学期",
                        xtype: "TermCombo",
                        readOnly: false,
                        value: SctCoz.Comm.getSctCozTerm()
                    },
                    {
                        fieldLabel: "开课年级",
                        xtype: "GradesCombo",
                        allowBlank: false
                    },
                    {
                        fieldLabel: "开课学院",
                        xtype: "CollegeCombo",
                        allowBlank: false
                    },
                    {
                        fieldLabel: "开课专业",
                        xtype: "MajorCombo",
                        allowBlank: false
                    }
                ],
                QueryByStore: queryByStore
            });
            const user = SctCoz.Student.getUserInfo();
            queryForm.getForm().setValues(user);

            // 表格
            const planGrid = Ext.create("SctCoz.Query.QueryGrid", {
                title: "实验计划",
                height: "50%",
                region: "center",
                store: Ext.create("SctCoz.Student.LabPlan"),
                columns: [
                    { header: "序号", xtype: "rownumberer", width: 40 },
                    { header: "计划序号", dataIndex: "planid", width: 80 },
                    { header: "年级", dataIndex: "grade", width: 50 },
                    { header: "专业", dataIndex: "spname", width: 100 },
                    {
                        header: "课程代号",
                        dataIndex: "courseid",
                        width: 95
                    },
                    { header: "课程名称", dataIndex: "cname", width: 160 },
                    { header: "实验学时", dataIndex: "syxs", width: 95 },
                    { header: "上机学时", dataIndex: "sjxs", width: 95 },
                    { header: "其他学时", dataIndex: "qtxs", width: 95 },
                    { header: "实验室", dataIndex: "srname", width: 160 },
                    {
                        header: "备注",
                        dataIndex: "comm",
                        width: 160,
                        flex: 1
                    }
                ],
                listeners: {
                    select: function (me, record) {
                        const params = {
                            // term: record.get("term"), // 添加这个参数可以过滤未选项目
                            labid: record.get("planid")
                        };
                        const grid = this.up("[xtype='query-panel']").down("grid[region='south']");
                        const store = grid.getStore();
                        store.getProxy().extraParams = params;
                        store.load();
                        // store.sort({ property: "itemno", direction: "ASC" });
                    }
                }
            });
            const itemGrid = Ext.create("Ext.grid.Panel", {
                title: "实验计划项目",
                region: "south",
                height: "50%",
                columnLines: true,
                viewConfig: {
                    forceFit: true,
                    stripeRows: true,
                    enabconstextSelection: true
                },
                // features: [{ ftype: "grouping" }], 多余的属性导致选中时报错
                store: Ext.create("SctCoz.Student.LabItem"),
                columns: [
                    { header: "序号", xtype: "rownumberer", width: 40 },
                    {
                        header: "操作",
                        xtype: "actionrendercolumn",
                        width: 60,
                        dataIndex: "scted",
                        renderer: (scted) => (scted ? ["查询"] : ["选批次"]),
                        items: [
                            {
                                handler: (grid, rowIndex) => {
                                    const record = grid.getStore().getAt(rowIndex);
                                    grid.getSelectionModel().select(record);
                                    sctcno(record);
                                }
                            }
                        ]
                    },
                    {
                        header: "已选",
                        width: 40,
                        xtype: "booleancolumn",
                        trueText: "是",
                        falseText: "否",
                        dataIndex: "scted"
                    },
                    {
                        header: "项目序号",
                        dataIndex: "xh",
                        width: 90,
                        doSort: function (state) {
                            const store = this.up("grid").getStore();
                            store.sort({
                                property: "itemno",
                                direction: state
                            });
                        }
                    },
                    {
                        header: "项目名称",
                        dataIndex: "itemname",
                        width: 360
                    },
                    {
                        header: "小组人数",
                        dataIndex: "groupperson",
                        width: 60
                    },
                    { header: "学时", dataIndex: "planhours", width: 40 },
                    { header: "实验类别", dataIndex: "sylb", width: 100 },
                    { header: "实验类型", dataIndex: "sylx", width: 100 },
                    {
                        header: "备注",
                        dataIndex: "comm",
                        minWidth: 50,
                        flex: 1
                    }
                ]
            });

            // 实验批次

            const sctSubmit = function (record) {
                const rw = this;
                Ext.Ajax.request({
                    url: "/student/labSave", // 请求的地址
                    params: record.data,
                    method: "POST",
                    success: (response) => {
                        const obj = Ext.decode(response.responseText);
                        if (obj.success) {
                            Ext.Msg.alert("成功", obj.msg, () => {
                                const jg = itemGrid.getSelectionModel().getSelection();
                                if (jg.length > 0) {
                                    jg[0].data.scted = 1;
                                    jg[0].commit();
                                    rw.up("window").close();
                                }
                            });
                        } else {
                            Ext.Msg.alert("错误", obj.msg);
                        }
                    },
                    failure: (response) => {
                        Ext.Msg.alert("错误", "状态:" + response.status + ": " + response.statusText);
                    }
                });
            };
            const pcSto = Ext.create("Edu.store.LabBatch");
            Ext.apply(pcSto.proxy, { url: "/student/itembatch" });
            const gdcno = Ext.create("Edu.view.ShowGrid", {
                // selType: "checkboxmodel",
                store: pcSto,
                columns: [
                    {
                        header: "操作",
                        xtype: "actionrendercolumn",
                        width: 40,
                        renderer: () => ["提交"],
                        items: [
                            {
                                handler: (grid, rowIndex) => {
                                    const rec = grid.getStore().getAt(rowIndex);
                                    grid.getSelectionModel().select(rec);
                                    sctSubmit(rec);
                                }
                            }
                        ]
                    },
                    {
                        header: "批次",
                        dataIndex: "bno",
                        width: 40,
                        editor: { xtype: "numberfield", hideTrigger: true }
                    },
                    { header: "周次", dataIndex: "zc", width: 40 },
                    { header: "星期", dataIndex: "xq", width: 40 },
                    { header: "大节", dataIndex: "jc", width: 40 },
                    { header: "人数", dataIndex: "persons", width: 40 },
                    { header: "已选人数", dataIndex: "stusct", width: 80 },
                    { header: "实验教师", dataIndex: "name", width: 80 },
                    { header: "实验教室", dataIndex: "srdd", width: 80 },
                    {
                        header: "备注",
                        dataIndex: "comm",
                        minWidth: 50,
                        flex: 1
                    }
                ]
            });
            let win;
            const sctcno = (record) => {
                pcSto.removeAll();
                const sto = gdcno.getStore();
                sto.proxy.extraParams.xh = record.data.xh;
                sto.load();
                if (!win) {
                    win = Ext.create("Ext.window.Window", {
                        modal: true,
                        height: "60%",
                        width: "60%",
                        layout: "fit",
                        closeAction: "hide",
                        items: [gdcno]
                    });
                }
                win.setTitle(record.data.itemname + "(" + record.data.xh + ")");
                win.show();
            };
            // const pan = Ext.create("Edu.view.ShowPanel", {
            // 	title: "实验选课",
            // 	items: [qryfrm, grid, xmGd]
            // });

            // me.add(pan);
            const panel = Ext.create("SctCoz.Query.QueryPanel", {
                Titconstext: "实验选课【插件模式】",
                items: [queryForm, planGrid, itemGrid]
            });
            me.add(panel);
        }
    }
}; // 重写中
const labUnSctNew = {
    action: "LabUnSct",
    children: [],
    command: null,
    controller: "Student",
    id: "bstuk110",
    leaf: true,
    text: "实验退课",
    type: "action"
};
const load = () => {
    // // 一些参数
    // const crtl = {
    //     ver: "0.3" // 主要版本号
    // };
    // 初始化工具
    if (!SctCoz.tools.inited) {
        SctCoz.tools.init({ debugLevel: 0 });
    }
    // if (SctCoz.tools.ClassStorage.Load("value", "T_L_Col") !== null) {
    // 	SctCoz.tools.ClassStorage.Save("value", col, "T_L_Col");
    // }

    // 抢课和重修差别不大只在stype参数上所以共用一个描绘函数

    SctCoz.tools.menuChange(StuSctNew);
    SctCoz.tools.menuChange(StuSctCxNew);
    // TO-DO[9]: <添加实验选课> {添加对实验选课的支持}
    SctCoz.tools.menuChange(LabSctNew);
    SctCoz.tools.menuChange(labUnSctNew);
};
// 启动接口
Ext.onReady(load);
