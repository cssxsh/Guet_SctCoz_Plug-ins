// ==UserScript==
// @name         Take Lessons
// @namespace    http://sec.guet.edu.cn
// @version      0.3
// @description  新教务抢课脚本
// @author       cssxsh
// @include      http://bkjw.guet.edu.cn/Login/MainDesktop
// @include      http://172.16.13.22/Login/MainDesktop
// @grant        none
// ==/UserScript==

//一些参数
var col = {
    time: 1000, //抢课时间间隔
    old_hide: true //旧模块是否隐藏
};


//启动接口
Ext.onReady(function (){
    //定义监视器
    var panel = Ext.getCmp("content_panel");

    panel.addListener("add", function () {
        var last = panel.items.items[panel.items.items.length - 1];
        Rreplace_StuSct(last.id, col.time);
    });

    //载入一些提示
    var text = Ext.getCmp("content_panel").items.items[0].body.dom;

    text.innerHTML += '<br/>';
    text.innerHTML += '<br/>NAME:Take Lessons';
    text.innerHTML += '<br/>VERSION:0.3';
    text.innerHTML += '<br/>AUTHOR:cssxsh';
    text.innerHTML += '<br/>COMM:bug极多';
    console.log("Bug真的多。");
    //Ext.Msg.alert("提示", "这是一个demo");
});
function Rreplace_StuSct (module, time) {
    //判断模块是否符合
    var scttype = '';
    switch (module) {
        case ('StuSct'):
            scttype = '正常';
            break;
        case ('StuSctCx'):
            scttype = '重修';
            break;
        default :
			//不符合要求退出
            return ;
    }
    //加载修改过的功能
    Ext.QuickTips.init();
    Ext.form.Field.prototype.MsgTarget = 'side';

    var dptSto = Ext.data.StoreManager.lookup('dptSto');

    var tmSto = Ext.data.StoreManager.lookup('xqSto');
    var spSto = Ext.create('Edu.store.Spinfo');
    function sctDpt(cmb, rec) {
        var dpt = rec[0].data.dptno;
        spSto.clearFilter();
        spSto.filter('dptno', new RegExp('^' + dpt + '$'));
        qryfrm.getForm().findField("spno").setValue("");
    }
    var qryfrm = Ext.create('Edu.view.QueryForm',{
        url:'/CourseSct/StuInfo',
        labelWidth: 60,
        argcols: [{
                xtype: 'termcombo',
				store: tmSto,
				allowBlank: false,
				labelWidth:30,
				readOnly: true,
				value:getTerm()[1]
            }, {
				xtype: 'gradecombo',
				labelWidth: 30,
				width: 120,
				allowBlank: false,
				size: 6
			}, {
                xtype: 'dptcombo',
				store: dptSto,
                fieldLabel: '开课学院',
				editable: false,
				listeners: {select: sctDpt}
            }, {
                xtype: 'kscombo',
                store: spSto,
				width:240,
				allowBlank: false
            }, {
                fieldLabel: '选课类别',
				name: 'stype',
				xtype: 'hidden',
				value: scttype
            }, {
                margin: '0 3',
				xtype: 'button',
				text: '查询',
				formBind: true,
				handler: queryStore
            }
		]
    });
    qryfrm.load();
    function queryStore() {
        var f = qryfrm.getForm();
        var params = f.getValues();
        var sto = grid.getStore();
        sto.removeAll();
        cnoSto.removeAll();
        sto.proxy.extraParams = params;
        sto.load();
    }
    var setSto = Ext.create('Ext.data.Store', {
        fields: ['id','term', 'courseid', 'cname', 'spno', 'grade', 'tname',  'xf', 'scted'],
        proxy: {
            type: 'ajax', url: '/CourseSct/GetPlan',
            reader: {
				type: 'json',
				root: 'data'
			}
        }
    });

    var grid = Ext.create('Edu.view.ShowGrid', {
		store: setSto,
        columns: [{
				header: "序号",
				xtype: 'rownumberer',
				width: 30
			}, {
                xtype: 'actionrendercolumn',
				header: '操作',
                width: 40,
                dataIndex:'scted',
                renderer: function (v) {
					if (!v) {
						return ['选课'];
					}
				},
                items: [{
                    handler: function (grid, rowIndex, colIndex) {
                        var rec = grid.getStore().getAt(rowIndex);
                        grid.getSelectionModel().select(rec);
                        sctcno(rec);
                    }
                }]
            }, {
				header: "已选",
				width: 35,
				xtype: 'booleancolumn',
				trueText: '是',
				falseText: '否',
				dataIndex: 'scted'
			}, {
				header: "课程代码",
				dataIndex: "courseid",
				width: 95
			}, {
				header: "课程名称",
				dataIndex: "cname",
				width: 240
			}, {
				header: "课程性质",
				dataIndex: "tname",
				minWidth: 60
			}, {
				header: "学分",
				dataIndex: "xf",
				width: 40
			}
		]
    });
    function sctcno1(){
        var rs = grid.getSelectionModel().getSelection();
        if (rs.length > 0) {
                var sto = gdcno.getStore();
                sto.proxy.extraParams = rs[0].data;
                sto.load();
            } else {
                Ext.Msg.alert("提示信息", "请选择一条记录进行编辑。");
            }
        }
        var cnoSto = Ext.create('Ext.data.Store', {
            fields: ['term', 'courseno','grade','spno','scted', 'name','ap','xf','lot', 'courseid','stype', 'maxstu', 'sctcnt','comm'],
            proxy: {
                type: 'ajax', url: '/CourseSct/GetPlanCno',
                reader: {
					type: 'json',
					root: 'data'
				}
			},
			groupField: 'scted'
		}
	);

    function sctSubmit(){
        var gd = this.up('grid');
        var rs = gd.getSelectionModel().getSelection();
		if (rs.length > 0) {
            rs[0].data.stype = qryfrm.getValues().stype;
			Ext.Ajax.request({
				url: "/CourseSct/SctSave" , //请求的地址
				params: rs[0].data,
				method: "POST",
				success: function (response, opts) {
					var obj = Ext.decode(response.responseText);
					if (obj.success) {
                        Ext.Msg.alert("成功", obj.msg, function () {
							var jg = grid.getSelectionModel().getSelection();
							if (jg.length > 0) {
								jg[0].data.scted = 1;
								jg[0].commit();
								cnoSto.removeAll();
								gd.up('window').close();
							}
						});
                    } else {
                        Ext.Msg.alert("错误", obj.msg);
                    }
                },
                failure: function (response, opts) {
                    Ext.Msg.alert('错误', '状态:' + response.status + ': ' + response.statusText);
                }
            });
        } else {
            Ext.Msg.alert("提示", "请选择一个课号提交。");
        }
    }
	function sctSubmit_(){
        var gd = this.up('grid');
        var rs = gd.getSelectionModel().getSelection();
		if (rs.length > 0) {
            rs[0].data.stype = qryfrm.getValues().stype;
			var task = {
				run: function () {
					Ext.Ajax.request({
						url: "/CourseSct/SctSave" , //请求的地址
						params: rs[0].data,
						method: "POST",
						success: function (response, opts) {
							var obj = Ext.decode(response.responseText);
							if (obj.success) {
								Ext.TaskManager.stop(task);
								Ext.Msg.hide();
								Ext.Msg.alert("成功", obj.msg, function () {
									var jg = grid.getSelectionModel().getSelection();
									if (jg.length > 0) {
										jg[0].data.scted = 1;
										jg[0].commit();
										cnoSto.removeAll();
										gd.up('window').close();
									}
								});
							} else {
								Ext.Msg.updateProgress(Ext.TaskManager.timerId % 100 / 100);
							}
						},
						failure: function (response, opts) {
							Ext.TaskManager.stop(task);
							Ext.Msg.hide();
							Ext.Msg.alert('错误', '状态:' + response.status + ': ' + response.statusText);
						}
					});
					Ext.Msg.show({
						title: "提示",
						msg: "点击提示框左上角停止选课。",
						icon: Ext.Msg.INFO,
                        closable: true,//Ext控件好像没有办法同时显示进度框和按钮
                        progress: true,
						progressText: "课号: " + rs[0].data.courseno + " 正在抢课！",
						fn: function () {
							Ext.TaskManager.stop(task);
						}
					});
				}, 
				interval: time
			};
			Ext.TaskManager.start(task);
        } else {
            Ext.Msg.alert("提示", "请选择一个课号提交。");
        }
    }
    function sctcno(rec){
        cnoSto.removeAll();
        if (rec.get('scted') == 1) {
			return Ext.Msg.alert('提示','本课程已选！');
		}
        var gdcno = Ext.create('Edu.view.ShowGrid', {
            selType: "checkboxmodel",
			selModel: {mode: "SINGLE" },
            store: cnoSto,
            tbar:[{
					xtype: 'button',
					text: '提交',
					handler: sctSubmit
				}, {
					xtype: 'button',
					text: '抢课',
					handler: sctSubmit_
				}
			],
            features:[{
				ftype:'groupingsummary',
				groupHeaderTpl:Ext.create('Ext.XTemplate', '<div>{groupValue:this.formatName}共{children.length}个课号</div>', {
                    formatName: function(groupValue) {
                            return groupValue == 0 ? "本专业" : "其它专业";
                    }
                })
            }],
            columns: [{
			        header: "序号",
					xtype: 'rownumberer',
					width: 30
				}, {
					header: "专业",
					dataIndex: "spno",
					width: 94,
					renderer: function(v) {
						return sctDropDown(v,spSto,'spno','spname');
					}
				}, {
					header: "课程序号",
					dataIndex: "courseno",
					width: 70
				}, {
					header: "容量",
					dataIndex: "maxstu",
					width: 35
				}, {
					header: "已选",
					dataIndex: "sctcnt",
					width: 35
				},{
					header: "抽签",
					width: 35,
					xtype: 'booleancolumn',
					trueText: '是',
					falseText: '否',
					dataIndex: 'lot'
				}, {
					header: "年级",
					dataIndex: "grade",
					width: 45
				}, {
					header: "学分",
					dataIndex: "xf",
					width: 40
				}, {
					header: "教师",
					dataIndex: "name",
					width: 80
				}, {
					header: "上课安排",
					dataIndex: "ap",
					width: 94,
					flex:1
				}]
            });
            var sto = gdcno.getStore();
            sto.proxy.extraParams = rec.data;
            sto.load();
            var win = Ext.create('Ext.window.Window', {
                title: rec.data.cname + '(' + rec.data.courseid + ')',
                modal: true, height: '80%', width: '80%', layout: 'fit',
                items: [gdcno]
            });
            win.show();
        }
    var pan = Ext.create('Edu.view.ShowPanel', {
        title: '学生' + scttype + '选课',
        items: [{
			region: 'north',
			layout: 'fit',
			items: [qryfrm]
		},{
			region: 'center',
			layout: 'fit',
			flex: 3,
			items: [grid]
		}]
    });

    var tab = Ext.getCmp(module);
    tab.add(pan);

	//隐藏多余的旧模块
    if (col.old_hide) {
        tab.addListener("add", function () {
            this.items.items[1].hide();
        });
    }
}
