// models / data
kendo.culture("ru-RU");

var items = new kendo.data.DataSource({
    schema: { model: {} },
    transport: { read: { url: "menu/", dataType: "json" } }
});

var cart = kendo.observable({
    contents: [],
    cleared: false,

    contentsCount: function () {
        return this.get("contents").length;
    },

    add: function (item) {
        var found = false;

        this.set("cleared", false);

        for (var i = 0; i < this.contents.length; i++) {
            var current = this.contents[i];
            if (current.item === item) {
                current.set("quantity", current.get("quantity") + 1);
                found = true;
                break;
            }
        }

        if (!found) {
            this.contents.push({ item: item, quantity: 1 });
        }
    },

    remove: function (item) {
        for (var i = 0; i < this.contents.length; i++) {
            var current = this.contents[i];
            if (current === item) {
                this.contents.splice(i, 1);
                break;
            }
        }
    },

    empty: function () {
        var contents = this.get("contents");
        contents.splice(0, contents.length);
    },

    clear: function () {
        var contents = this.get("contents");
        contents.splice(0, contents.length);
        this.set("cleared", true);
    },

    total: function () {
        var price = 0,
            contents = this.get("contents"),
            length = contents.length,
            i = 0;

        for (; i < length; i++) {
            price += parseFloat(contents[i].item.price) * contents[i].quantity;
        }

        return kendo.format("{0:c}", price);
    }
});

var layoutModel = kendo.observable({
    cart: cart
});

var cartPreviewModel = kendo.observable({
    cart: cart,

    cartContentsClass: function () {
        return this.cart.contentsCount() > 0 ? "active" : "empty";
    },

    removeFromCart: function (e) {
        this.get("cart").remove(e.data);
    },

    emptyCart: function () {
        cart.empty();
    },

    itemPrice: function (cartItem) {
        return kendo.format("{0:c}", cartItem.item.price);
    },

    totalPrice: function () {
        return this.get("cart").total();
    },

    proceed: function (e) {
        layout.showIn("#content", order);
    }
});

var orderModel = kendo.observable({
    validator: null,
    cart: cart,
    order_text: "Заказать",
    in_progress: false,
    o: {
        phoneNumber: "",
        city: "Махачкала",
        street: "",
        house: "",
        flat: "",
        comments: "",
        order_id_list: []
    },

    order: function (e) {
        var that = this;
        if (!that.validator) {
            that.validator =  $("#details-order").kendoValidator({
                rules: {
                    required: function (input) {
                        if (input.is("[required]")) {
                            input.val($.trim(input.val())); //удалить обертывающие пробелы
                            return input.val() !== "";
                        } else return true;
                    }
                },
                messages: { required: "Поле не может быть пустым" }
            }).data("kendoValidator");
        }
        if (!that.validator.validate()) { console.log("not validate");return false; }
        if (that.in_progress) { return false; }
        var contents = that.cart.contents;

        var order_id_list = [];
        for(var i=0; i<contents.length; i++) {
            order_id_list.push({
                menu_id: contents[i].item.id,
                quantity: contents[i].quantity
            });
        }
        that.o.order_id_list = order_id_list;
        that.set("in_progress", true);
        that.set("order_text", "Обработка");
        $.post("add_order/", {
            item: JSON.stringify(that.o)
        }, function(data) {
            that.set("in_progress", false);
            that.set("order_text", "Заказать");
            that.get("cart").clear();
            menu.navigate("/");
        }, "json")
    }

});

var indexModel = kendo.observable({
    items: items,
    cart: cart,

    addToCart: function (e) {
        cart.add(e.data);
    }
});

var detailModel = kendo.observable({
    imgUrl: function () {
        var current = this.get("current");
        if (current) {
            return current.image
        } else {
            return ""
        }
    },

    price: function () {
        var current = this.get("current");
        if (current) {
            return kendo.format("{0:c}", this.get("current").price);
        } else {
            return kendo.format("{0:c}", 0);
        }
    },

    addToCart: function (e) {
        cart.add(this.get("current"));
    },

    setCurrent: function (itemID) {
        var current = items.get(itemID);
        if (current) {
            this.set("current", current);
        }
    },

    previousHref: function () {
        var index = items.indexOf(this.get("current"));
        if (index == -1) {
            return "#"
        }
        do {
            index = index - 1;
            if (index < 0) index = items.total() - 1;
        } while (items.at(index).type == "category");

        var id = items.at(index).id;

        return "#/menu/-" + id;
    },

    nextHref: function () {
        var index = items.indexOf(this.get("current"));
        if (index == -1) {
            return "#"
        }
        do {
            index = index + 1;
            if (index > items.total() - 1) index = 0;
        } while (items.at(index).type == "category");

        var id = items.at(index).id;

        return "#/menu/" + id;
    }

});

// Views and layouts
var layout = new kendo.Layout("layout-template", { model: layoutModel }); //Основная форма
var cartPreview = new kendo.Layout("cart-preview-template", { model: cartPreviewModel }); //Список корзина
var index = new kendo.View("index-template", { model: indexModel }); //Основной список
var checkout = new kendo.View("checkout-template", {model: cartPreviewModel }); //Корзина
var order = new kendo.View("order-template", {model: orderModel }); //Форма заказа
var detail = new kendo.View("detail-template", { model: detailModel }); //Элемент меню

var menu = new kendo.Router({
    init: function () {
        layout.render("#application");
    }
});

var viewingDetail = false;

// Routing
menu.route("/", function () {
    viewingDetail = false;
    layout.showIn("#content", index);
    layout.showIn("#pre-content", cartPreview);
    //$("body").scrollTo(0);

    items.fetch(function(e) {
        var $titles = $('#titles');
        if ($titles.children().length > 0) { return }
        var data = this.data(),
            $items = $();
        $.each(data, function (i,e) {
            if (e.type === "category") {
                $items = $items.add('<li class="title"><a href="#" data-id="menu'+ e.id+'">'+ e.name+'</a></li>');
            }
        });

        $titles.append($items).affix({
            offset: {
                top: function () {
                    return $("#content").offset().top - 5 /* top: 5px; */;
                },
                bottom: 100
            }
        }).on("click", ".title a", function (e) {
            var id = $(this).data("id");
            $('body').scrollTo("#"+id);
            return false;
        })
    });
});

menu.route("/checkout", function () {
    viewingDetail = false;
    layout.showIn("#content", checkout);
    cartPreview.hide();
    $("body").scrollTo(0);
});

menu.route("/menu/:id", function (itemID) {
    layout.showIn("#pre-content", cartPreview);
    $("body").scrollTo(0);
    var transition = "",
        current = detailModel.get("current");

    if (viewingDetail && current) {
        transition = itemID > 0 ? "tileleft" : "tileright";
    }

    itemID = Math.abs(itemID);

    items.fetch(function(e) {
        var item = items.get(itemID);

        if (typeof item == "undefined") {
            menu.navigate("/");
            return
        }
        if (detailModel.get("current")) {
            layout.showIn("#content", detail, transition);
            detailModel.setCurrent(itemID);
        } else {
            detailModel.setCurrent(itemID);
            layout.showIn("#content", detail, transition);
        }
    });

    viewingDetail = true;
});

$(function () {
    menu.start();
});
