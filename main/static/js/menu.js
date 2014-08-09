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
        //this.get("cart").clear();
        //sushi.navigate("/");
        layout.showIn("#content", order);
    }
});

var orderModel = kendo.observable({
    validator: null,
    cart: cart,
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
        if (!this.validator) {
            this.validator =  $("#details-order").kendoValidator({
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
        if (!this.validator.validate()) { console.log("not validate");return false; }
        var contents = this.cart.contents;

        var order_id_list = [];
        for(var i=0; i<contents.length; i++) {
            order_id_list.push({
                menu_id: contents[i].item.id,
                quantity: contents[i].quantity
            });
        }
        this.o.order_id_list = order_id_list;
        $.post("add_order/", {
            item: JSON.stringify(this.o)
        }, function(data) {
            
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
        } else {
            return ""; ///FIXME: show menu
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

        return "#/menu/" + id;
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

//    kCal: function() {
//        return kendo.toString(this.get("current").stats.energy /  4.184, "0.0000");
//    }
});

// Views and layouts
var layout = new kendo.Layout("layout-template", { model: layoutModel }); //Основная форма
var cartPreview = new kendo.Layout("cart-preview-template", { model: cartPreviewModel }); //Список корзина
var index = new kendo.View("index-template", { model: indexModel }); //Основной список
var checkout = new kendo.View("checkout-template", {model: cartPreviewModel }); //Корзина
var order = new kendo.View("order-template", {model: orderModel }); //Форма заказа
var detail = new kendo.View("detail-template", { model: detailModel }); //Элемент меню

var sushi = new kendo.Router({
    init: function () {
        layout.render("#application");
    }
});

// Routing
sushi.route("/", function () {
    layout.showIn("#content", index);
    layout.showIn("#pre-content", cartPreview);
});

sushi.route("/checkout", function () {
    layout.showIn("#content", checkout);
    cartPreview.hide();
});

sushi.route("/menu/:id", function (itemID) {
    layout.showIn("#pre-content", cartPreview);

    detailModel.setCurrent(itemID);
    layout.showIn("#content", detail);
});

$(function () {
    sushi.start();
    sushi.navigate("");
    $('#titles').affix({
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
    }).css("top", "5px");

    items.fetch(function(e) {
        $.each(this.data(), function(i, e) {
            if (e.type == "category") {
                $('<li class="title"><a href="#" data-id="menu'+ e.id+'">'+ e.name+'</a></li>').appendTo("#titles");
            }
        })
    });

});
