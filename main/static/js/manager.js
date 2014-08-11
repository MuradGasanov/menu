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

    $(".show_categories").click(function () {
        $("#categories_window").modal();
    });

    $(".expand_categories").click(function () {

    });

    $(".collapse_categories").click(function () {

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
        //template: kendo.template($('#fileTemplate').html()),
        files: [],
        menu_id: 0,
        success: function (e) {
            if (e.operation == "upload") {
                $change_menu_window.modal("hide");
                var data = menu.dataSource;
                var item = data.get(e.response.id);
                if (item) {
                    item.image = e.response.image;
                }
                reset_file_uploader(); ///FIXME: убрать функцию, она вызывается только сдесь
            }
        },
        select: function (e) {
        },
        upload: function (e) {
            e.data = {item: JSON.stringify({menu_id: this.options.menu_id})};
        },
        remove: function (e) {
            var files = e.files;
            e.data = {item: JSON.stringify(files)};
        }
    }).data("kendoUpload");
    $file_uploader.wrapper.removeClass("k-upload-empty"); //.css("margin", "0 36px 15px");

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
                if (operation !== "read" && options) {
                    return {item: kendo.stringify(options)};
                }
            }
        },
        group: { field: "category.name" },
        schema: {
            model: {
                id: "id",
                fields: { name: {type: "string"}, description: {type: "string"}, price: {type: "number"} }
            }
        },
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
                        var data = categories.dataSource.data();
                        if (data.length === 0) {
                            return false;
                        }
                        var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
                        menu_model.set("is_edit", true);
                        menu_model.set("categories", data);
                        preview.attr("src", dataItem.image);
                        menu_model.set("o", {
                            id: dataItem.id,
                            name: dataItem.name,
                            description: dataItem.description,
                            price: dataItem.price,
                            category: dataItem.category
                        });
                        $change_menu_window.modal("show");
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


    var preview = $("#preview");
    var menu_model = kendo.observable({
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
                    if (!input.is("[name=category]")) { //удалить обертывающие пробелы
                        input.val($.trim(input.val())); //для всех кроме выпадаюшего списка
                    }
                    return !!input.val();
                } else return true;
            },
            price: function(input) {
                if (input.is("[name=price]")) {
                    return input.val() !== "0";
                } else return true;
            }
        },
        messages: {
            required: "Поле не может быть пустым",
            price: "Цена не может быть нулем"
        }
    }).data("kendoValidator");

    $(".add_menu").click(function (e) {
        var data = categories.dataSource.data();
        //if (data.length === 0) {
        //    noti({title: "Нет категорий", message: "Необходимо сначала создать хотя бы одну категорию"},  "error", 5000);
        //    return false;
        //}
        $(".k-widget.k-tooltip.k-tooltip-validation.k-invalid-msg").hide();
        menu_model.set("is_edit", false);
        preview.attr("src", "/media/default.png"); /// FIXME: hard string
        menu_model.set("categories", data);
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
        $file_uploader.options.menu_id = d.id;
        var is_upload = $("#change_menu_window button.k-button.k-upload-selected").click();
        if (is_upload.length == 0) {
            $change_menu_window.modal("hide");
        }
        var data = menu.dataSource;
        var item = data.get(d.id);
        if (item) {
            item.name = d.name;
            item.description = d.description;
            item.price = d.price;
            item.category = d.category;
        } else {
            item = {
                id: d.id,
                name: d.name,
                description: d.description,
                price: d.price,
                category: d.category
            };
            data.add(item);
        }
        menu.refresh();
        //$change_menu_window.model("hide");
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

    $(".reload_menu").click(function (e) {
        menu.dataSource.read();
        menu.refresh();
        return false;
    });

    var orders = $("#orders").kendoGrid({
        dataSource: {
            type: "json",
            transport: {
                read: {
                    url: MANAGER_BASE_URL + "orders/read/",
                    type: "POST",
                    dataType: "json"
                },
                destroy: {
                    url: MANAGER_BASE_URL + "orders/destroy/",
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
                    fields: { ctreate_at: {type: "date"}, customer: {type: "string"}, address: {type: "string"}, status: {type: "number"}}
                }
            }
        },
        sortable: true,
        editable: {
            mode: "inline",
            confirmation: "Вы уверены, что хотите удалить запись?",
            confirmDelete: "Да",
            cancelDelete: "Нет"
        },
        toolbar: [
            { template: kendo.template($("#orders_header_template").html()) }
        ],
        detailTemplate: kendo.template($("#orders_detail_template").html()),
        detailInit: order_detail_init,
        columns: [
            { field: "create_at", title: "Дата", template: "#=kendo.toString(new Date(Date.parse(create_at)), 'd MMM  HH:mm')#", width: "200px" },
            { field: "customer", title: "Телефон", width: "150px" },
            { field: "address", title: "Адрес"},
            { command: [
                {
                    name: "destroy",
                    template: "<a class='k-button k-grid-delete' title='Удалить'><span class='k-icon k-delete'></span></a>"
                }
            ], width: 46, attributes: { style: "text-align: center;"}  }
        ]
    }).data("kendoGrid");

});

function order_detail_init(e) {
    var detailRow = e.detailRow;
    var order_id = e.data.id;

    detailRow.find("#comment").text(e.data.comment);

    var orderDetailDS = new kendo.data.DataSource({
        type: "json",
        transport: {
            read: {
                url: "/manager/orders/detail/",
                type: "POST",
                dataType: "json"
            },
            parameterMap: function (options, operation) {
                if (operation == "read") {
                    return {order_id : order_id };
                }
                if (options) {
                    return {item: kendo.stringify(options)};
                }
            }
        },
        aggregate: [
            { field: "price", aggregate: "total_price" }
        ],
        serverAggregates: true,
        schema: {
            data: "data",
            aggregates: "aggregates",
            model: {
                id: "id"
            }
        }
    });
    var order_detail = detailRow.find("#order_detail").kendoGrid({
        dataSource: orderDetailDS,
        height: 300,
        sortable: true,
        editable: {
            mode: "inline",
            confirmation: "Вы уверены, что хотите удалить запись?",
            confirmDelete: "Да",
            cancelDelete: "Нет"
        },
        columns: [
            { field: "name", title: "Название" },
            { field: "quantity", title: "Количество", width: "100px" },
            { field: "price", title: "Цена ед.", width: "100px", footerTemplate:" #= total_price #" }
        ]
    }).data("kendoGrid");

}

function footerTemplate(data) {
}