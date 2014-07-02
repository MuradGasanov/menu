var MANAGER_BASE_URL = "/manager/";
$(document).ready(function () {

    $("#tabs").kendoTabStrip({
        animation: {
            open: {
                effects: "fadeIn"
            }
        }
    });

    var categories = $("#categories").kendoGrid({
        dataSource: {
            type: "json",
            transport: {
                read: {
                    url: MANAGER_BASE_URL + "categories/read/",
                    dataType: "json",
                    type: "POST"
                },
                destroy: {
                    url: MANAGER_BASE_URL + "categories/destroy/",
                    dataType: "json",
                    type: "POST"
                },
                parameterMap: function (options, operation) {
                    if (operation !== "read" && options) {
                        return {item: kendo.stringify(options)};
                    }
                }
            },
            schema: {
                model: {
                    id: "id",
                    fields: { name: {type: "string"}, weight: {type: "number"} }
                }
            },
            requestEnd: function (e) {

            }
        },
        toolbar: [
            { template: kendo.template($("#categories_header_template").html()) }
        ],
        sortable: true,
        editable: {
            mode: "inline",
            confirmation: "Вы уверены, что хотите удалить запись?",
            confirmDelete: "Да",
            cancelDelete: "Нет"
        },
        columns: [
            { command: [
                {  name: "category-edit",
                    click: function (e) {
                        $(".k-widget.k-tooltip.k-tooltip-validation.k-invalid-msg").hide();
                        var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
                        categories_model.set("is_edit", true);
                        categories_model.set("o", {
                            id: dataItem.id,
                            name: dataItem.name,
                            weight: dataItem.weight
                        });
                        $change_categories_window.modal("show");
                    },
                    template: "<a class='k-button k-grid-category-edit'><span class='k-icon k-edit '></span></a>"
                }
            ], title: " ", width: 46 },
            { field: "name", title: "Категория" },
            { field: "weight", title: "Позиция", width: "80px", attributes: { style: "text-align: center;"}},
            { command: [
                {
                    name: "destroy",
                    template: "<a class='k-button k-grid-delete' title='Удалить'><span class='k-icon k-delete'></span></a>"
                }
            ], width: "46px", attributes: { style: "text-align: center;"} }
        ]
    }).data("kendoGrid");

    var categories_model = kendo.observable({
        is_edit: false,
        o: {
            id: 0,
            name: "",
            weight: 0
        }
    });
    var $change_categories = $("#change_categories"),
        $change_categories_window = $("#change_categories_window");
    kendo.bind($change_categories, categories_model);
    var categories_validator = $change_categories.kendoValidator({
        rules: {
            required: function (input) {
                if (input.is("[required]")) {
                    input.val($.trim(input.val())); //удалить обертывающие пробелы
                    return input.val() !== "";
                } else return true;
            }
        },
        messages: {
            required: "Поле не может быть пустым"
        }
    }).data("kendoValidator");

    $(".add_categories").click(function (e) {
        $(".k-widget.k-tooltip.k-tooltip-validation.k-invalid-msg").hide();
        categories_model.set("is_edit", false);
        categories_model.set("o", {
            id: 0,
            name: "",
            weight: 0
        });
        $change_categories_window.modal("show");
    });

    function categories_response_listener(d) {
        var data = categories.dataSource;
        var item = data.get(d.id);
        if (item) {
            item.name = d.name;
            item.weight = d.weight;
        } else {
            item = {
                id: d.id,
                name: d.name,
                weight: d.weight
            };
            data.add(item);
        }
        categories.refresh();
        $change_categories_window.modal("hide");
    }

    $("#categories_save").click(function (e) {
        if (!categories_validator.validate()) return false;
        var o = categories_model.get("o");
        if (categories_model.get("is_edit")) {
            $.post(MANAGER_BASE_URL + "categories/update/",
                {item: JSON.stringify(o) }, categories_response_listener, "json");
        } else {
            $.post(MANAGER_BASE_URL + "categories/create/",
                {item: JSON.stringify(o) }, categories_response_listener, "json");
        }
        return false;
    });

    var $reload_categories = $(".reload_categories");
    $reload_categories.click(function () {
        categories.dataSource.read();
        categories.refresh();
        return false;
    });

    $(".expand_categories").click(function () {
        categories.expandRow(categories.tbody.find("tr.k-master-row"));
    });

    $(".collapse_categories").click(function () {
        categories.collapseRow(categories.tbody.find("tr.k-master-row"));
    });

    var $file_uploader = $("#file_uploader").kendoUpload({
        multiple: false,
        async: {
            saveUrl: MANAGER_BASE_URL + "menu/image/set/",
            saveField: "image",
            removeUrl: MANAGER_BASE_URL + "menu/image/delete/",
            autoUpload: false
        },
        localization: {
            cancel: "Отменить",
            dropFilesHere: "Перетащите файл сюда",
            headerStatusUploaded: "Выполнено",
            headerStatusUploading: "Загрузка...",
            remove: "Удалить",
            retry: "Повторить",
            select: "Выбрать файлы для загрузки...",
            statusFailed: "Ошибка загрузки",
            statusUploaded: "Загруженно",
            statusUploading: "Загрузка...",
            statusWarning: "Внимание",
            uploadSelectedFiles: "Загрузить"
        },
        template: kendo.template($('#fileTemplate').html()),
        files: [],
        intellect_prop_id: 0,
        success: function (e) {
            if (e.operation == "upload") {
                //intellectual_property_window.close();
                var that = this;
                $.post(MANAGER_BASE_URL + "file/get_list/",
                    {item: JSON.stringify({intellectual_property_id: this.options.intellect_prop_id})},
                    function (data) {
                        that.wrapper.find("ul.k-upload-files.k-reset").remove();
//                                that.wrapper.find("li.k-file.k-file-success").remove();
                        that._renderInitialFiles(data);
                    });
            }
        },
        select: function (e) {
        },
        upload: function (e) {
            var f = e.files;
            for (var i = 0; i < f.length; i++) {
                for (var j = i + 1; j < f.length; j++) {
                    if ((f[i].name == f[j].name) &&
                        (f[i].size == f[j].size) &&
                        (f[i].extension == f[j].extension)) {
                        ///noty_error("Не загружайте одинаковые файлы!");
                        e.preventDefault();
                        return;
                    }
                }
            }
//                console.log(e);
            e.data = {item: JSON.stringify({intellectual_property_id: this.options.intellect_prop_id})};
        },
        remove: function (e) {
            var files = e.files;
            e.data = {item: JSON.stringify(files)};
            if (!confirm("Вы уверены, что хотите удалить " + files[0].name + "?")) {
                e.preventDefault();
            }
        }
    }).data("kendoUpload");
    $file_uploader.wrapper.removeClass("k-upload-empty").css("margin", "0 36px 15px");

    function reset_file_uploader() {
        $file_uploader.wrapper.find("strong.k-upload-status.k-upload-status-total").empty();
        $file_uploader.wrapper.find("ul.k-upload-files.k-reset").remove();
        $file_uploader._renderInitialFiles([]);
    }

    var menu_dataSource = new kendo.data.DataSource({
        type: "json",
        transport: {
            read: {
                url: MANAGER_BASE_URL + "menu/read/",
                type: "POST",
                dataType: "json"
            },
            destroy: {
                url: MANAGER_BASE_URL + "menu/destroy/",
                dataType: "json",
                type: "POST"
            },
            parameterMap: function (options, operation) {
//                if (operation == "read") {
//                    return {category_id: category_id};
//                }
//                if (options) {
//                    options.category_id = category_id;
//                    return {item: kendo.stringify(options)};
//                }
            }
        },
        group: { field: "category.name" },
//        schema: {
//            model: {
//                id: "id",
//                fields: { name: {
//                    validation: {
//                        required: { message: "Поле не может быть пустым" }
//                    }
//                }, tel: {}, mail: {} }
//            }
//        },
        requestEnd: function (e) {
        }
    });

    var menu = $("#menu").kendoGrid({
        dataSource: menu_dataSource,
        sortable: true,
        editable: {
            mode: "inline",
            confirmation: "Вы уверены, что хотите удалить запись?",
            confirmDelete: "Да",
            cancelDelete: "Нет"
        },
        toolbar: [
            { template: kendo.template($("#menu_header_template").html()) }
        ],
        columns: [
            { field: "category.name", hidden: true, title: "", groupHeaderTemplate: "#= value #" },
            { command: [
                {  name: "menu-edit",
                    click: function (e) {
                        $(".k-widget.k-tooltip.k-tooltip-validation.k-invalid-msg").hide();
                        var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
//                        categories_model.set("is_edit", true);
//                        categories_model.set("o", {
//                            id: dataItem.id,
//                            name: dataItem.name,
//                            weight: dataItem.weight
//                        });
//                        $change_categories_window.modal("show");
                    },
                    template: "<a class='k-button k-grid-menu-edit'><span class='k-icon k-edit '></span></a>"
                }
            ], title: " ", width: 46 },
            { field: "name", title: "Блюдо" },
            { field: "description", title: "Описание", width: "500px" },
            { field: "price", title: "Цена", width: "80px" },
            { command: [
                {
                    name: "destroy",
                    template: "<a class='k-button k-grid-delete' title='Удалить'><span class='k-icon k-delete'></span></a>"
                }
            ], width: 46, attributes: { style: "text-align: center;"}  }
        ]
    }).data("kendoGrid");

    window.menu_model = kendo.observable({ //FIXME: window
        is_edit: false,
        categories: [],
        o: {
            id: 0,
            name: "",
            description: "",
            price: 0,
            category: null
        }
    });

    var $change_menu = $("#change_menu"),
        $change_menu_window = $("#change_menu_window");
    kendo.bind($change_menu, menu_model);
    var menu_validator = $change_menu.kendoValidator({
        rules: {
            required: function (input) {
                if (input.is("[required]")) {
                    input.val($.trim(input.val())); //удалить обертывающие пробелы
                    return input.val() !== "";
                } else return true;
            }
        },
        messages: {
            required: "Поле не может быть пустым"
        }
    }).data("kendoValidator");

    $(".add_menu").click(function (e) {
        var data = categories.dataSource.data();
        if (data.length === 0) {
            noti({title: "Нет категорий", message: "Необходимо сначала создать хотя бы одну категорию"},  "error", 5000);
            return false;
        }
        $(".k-widget.k-tooltip.k-tooltip-validation.k-invalid-msg").hide();
        menu_model.set("is_edit", false);
        menu_model.set("categories",data);
        menu_model.set("o", {
            id: 0,
            name: "",
            description: "",
            price: 0,
            category: data[0]
        });
        $change_menu_window.modal("show");
    });

    function menu_response_listener(d) {
        console.log(d);
//        var data = categories.dataSource;
//        var item = data.get(d.id);
//        if (item) {
//            item.name = d.name;
//            item.weight = d.weight;
//        } else {
//            item = {
//                id: d.id,
//                name: d.name,
//                weight: d.weight
//            };
//            data.add(item);
//        }
//        categories.refresh();
//        $change_categories_window.modal("hide");
    }

    $("#menu_save").click(function (e) {
        if (!menu_validator.validate()) return false;
        var o = menu_model.get("o");
        if (menu_model.get("is_edit")) {
            $.post(MANAGER_BASE_URL + "menu/update/",
                {item: JSON.stringify(o) }, menu_response_listener, "json");
        } else {
            $.post(MANAGER_BASE_URL + "menu/create/",
                {item: JSON.stringify(o) }, menu_response_listener, "json");
        }
        return false;
    });
//
//    detailRow.find(".add_reload").click(function (e) {
//        department.dataSource.read();
//        department.refresh();
//        return false;
//    });

});

function addExtensionClass(extension) {
    switch (extension) {
        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.gif':
            return "img-file";
        default:
            return "default-file";
    }
}