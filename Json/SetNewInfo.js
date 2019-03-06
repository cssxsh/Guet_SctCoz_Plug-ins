window.plugTools.ClassStorage.Set("value", "NewInfo", function (data) {
    console.log("test");
    var result =  { 
        "id": "info-1",
        "title": "这是一个测试",
        "content": "test", 
        "postdate": null,
        "operator": "插件",
        "ntype": null,
        "reader": function (me) {
            Ext.create("Ext.window.Window", {
                title: this.title, width: "40%", height:"40%", modal: true, resizable: true, layout: "fit",
                items: [{xtype: "form", autoScroll: true, frame: true, padding: "1", html: me.content.replace(/\n/g, "<br/>")}]
            }).show();
        },
        "showdate": "2019年03月06日",
        "chk": null,
        "openshow": 0
    };
    Ext.getCmp("First").down("grid").getStore().loadData(result);
    return result;
});