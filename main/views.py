# -*- coding: utf-8 -*-
__author__ = 'Murad Gasanov'

from django.shortcuts import render_to_response, HttpResponse, HttpResponseRedirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
import main.models as models
import datetime
import json


@login_required(redirect_field_name=None)
def manager_page(request):
    return render_to_response("manager.html")

########################################################################################################################


def menu_page(request):
    return render_to_response("menu.html")

########################################################################################################################


def log_in(request):
    try:
        data = json.loads(request.body)
    except (TypeError, ValueError):
        return render_to_response("login.html")

    if not isinstance(data, dict):
        return HttpResponseForbidden()

    username = data.get("login")
    password = data.get("password")

    user = authenticate(username=username, password=password)

    if user:
        login(request, user)
        request.session.set_expiry(datetime.timedelta(days=1).seconds)
        if user.is_active:
            return HttpResponse(json.dumps({"error": []}), content_type="application/json")
        else:
            return HttpResponse(json.dumps({"error": ["Пользователь заблокирован"]}), content_type="application/json")
    else:
        return HttpResponse(json.dumps({"error": ["Неверный логин и пароль"]}), content_type="application/json")

########################################################################################################################


def log_out(request):

    logout(request)
    return HttpResponseRedirect("/")

########################################################################################################################


class Categories():
    def __init__(self):
        pass

    @staticmethod
    def read(request):
        categories = list(
            models.Categories.objects
            .all().values("id", "name", "weight")
        )
        if categories:
            return HttpResponse(json.dumps(categories), content_type="application/json")
        else:
            return HttpResponse("[]", content_type="application/json")

    @staticmethod
    def create(request):
        item = json.loads(request.POST.get("item"))

        category = models.Categories.objects.create(
            name=item.get("name"),
            weight=item.get("weight")
        )

        return HttpResponse(json.dumps({"id": category.id,
                                        "name": category.name,
                                        "weight": category.weight}),
                            content_type="application/json")

    @staticmethod
    def update(request):
        item = json.loads(request.POST.get("item"))

        category = models.Categories.objects.get(id=int(item.get("id")))

        category.name = item.get("name")
        category.weight = item.get("weight")
        category.save()

        return HttpResponse(json.dumps({"id": category.id,
                                        "name": category.name,
                                        "weight": category.weight}),
                            content_type="application/json")

    @staticmethod
    def destroy(request):
        item = json.loads(request.POST.get("item"))

        category = models.Categories.objects.get(id=int(item.get("id")))

        category.delete()

        return HttpResponse(item.get("id"), content_type="application/json")

########################################################################################################################


class Menu():
    def __init__(self):
        pass

    @staticmethod
    def read(request):
        menu = models.Menu.objects.all() #.order_by("category__weight")
        menu_list = []
        for m in menu:
            menu_list.append({
                "id": m.id,
                "name": m.name,
                "description": m.description,
                "price": m.price,
                "image": m.image.url,
                "category": {
                    "id": m.category.id,
                    "name": m.category.name
                }
            })
        if menu_list:
            return HttpResponse(json.dumps(menu_list), content_type="application/json")
        else:
            return HttpResponse("[]", content_type="application/json")

    @staticmethod
    def create(request):
        item = json.loads(request.POST.get("item"))

        category = models.Categories.objects.get(id=int(item.get("category").get("id")))

        menu = models.Menu.objects.create(
            name=item.get("name"),
            description=item.get("description"),
            price=float(item.get("price")),
            category=category
        )

        return HttpResponse(json.dumps({"id": menu.id,
                                        "name": menu.name,
                                        "description": menu.description,
                                        "price": menu.price,
                                        "category": {
                                            "id": menu.category.id,
                                            "name": menu.category.name}}), content_type="application/json")

    @staticmethod
    def image_set(request):
        item = json.loads(request.POST.get("item"))
        menu = models.Menu.objects.get(id=int(item.get("menu_id")))
        menu.image = request.FILES['image']
        menu.save()

        return HttpResponse(json.dumps({"id": menu.id,
                                        "image": menu.image.url}),
                            content_type="application/json")

    @staticmethod
    def update(request):
        item = json.loads(request.POST.get("item"))

        category = models.Categories.objects.get(id=int(item.get("category").get("id")))

        menu = models.Menu.objects.get(id=int(item.get("id")))
        menu.name = item.get("name")
        menu.description = item.get("description")
        menu.price = float(item.get("price"))
        menu.category = category
        menu.save()

        return HttpResponse(json.dumps({"id": menu.id,
                                        "name": menu.name,
                                        "description": menu.description,
                                        "price": menu.price,
                                        "category": {
                                            "id": menu.category.id,
                                            "name": menu.category.name}}), content_type="application/json")

    @staticmethod
    def destroy(request):
        item = json.loads(request.POST.get("item"))

        menu = models.Menu.objects.get(id=int(item.get("id")))

        menu.delete()

        return HttpResponse(item.get("id"), content_type="application/json")

    @staticmethod
    def user_read(request):
        categories = models.Categories.objects.all()

        menu_list = []
        for c in categories:
            menu = models.Menu.objects.filter(category=c.id)
            if menu:
                menu_list.append({
                    "id": -c.id,
                    "type": "category",
                    "name": c.name
                })
                for m in menu:
                    menu_list.append({
                        "id": m.id,
                        "type": "menu_item",
                        "name": m.name,
                        "description": m.description,
                        "price": m.price,
                        "image": m.image.url
                    })

        if menu_list:
            return HttpResponse(json.dumps(menu_list), content_type="application/json")
        else:
            return HttpResponse("[]", content_type="application/json")

########################################################################################################################


class Orders():
    def __init__(self):
        pass

    @staticmethod
    def add_order(request):
        item = json.loads(request.POST.get("item"))

        phone_number = item.get("phoneNumber")

        customer, created = models.Customers.objects.get_or_create(phone=phone_number)

        order = models.Orders.objects.create(
            customer=customer,
            city=item.get("city"),
            street=item.get("street"),
            house=item.get("house"),
            flat=item.get("flat"),
            comment=item.get("comments"),
            create_at=datetime.datetime.now()
        )

        models.OrderItem.objects.bulk_create(
            [models.OrderItem(
                order=order,
                menu_id=int(order_item.get("menu_id")),
                quantity=int(order_item.get("quantity"))
            ) for order_item in item.get("order_id_list")]
        )

        return HttpResponse("ok", content_type="application/json")

    @staticmethod
    def read(request):
        orders = models.Orders.objects.all()

        orders_list = []
        for order in orders:
            orders_list.append({
                "id": order.id,
                "customer": order.customer.phone,
                "address": order.address,
                "create_at": order.create_at,
                "comment": order.comment,
                "status": order.status
            })

        if orders_list:
            dt_handler = lambda obj: (
                obj.isoformat() if isinstance(obj, datetime.datetime) or isinstance(obj, datetime.date)
                else None
            )
            return HttpResponse(json.dumps(orders_list, default=dt_handler), content_type="application/json")
        else:
            return HttpResponse("[]", content_type="application/json")

    @staticmethod
    def destroy(request):
        item = json.loads(request.POST.get("item"))
        order = models.Orders.objects.get(id=int(item.get("id")))
        order.delete()
        return HttpResponse(item.get("id"), content_type="application/json")

    @staticmethod
    def detail(request):
        order_id = int(request.POST.get("order_id"))

        order_items = models.OrderItem.objects.filter(order_id=order_id)

        order_detail_list = []
        total_price = 0
        for order_item in order_items:
            order_detail_list.append({
                "id": order_item.id,
                "name": order_item.menu.name,
                "quantity": order_item.quantity,
                "price": order_item.menu.price
            })
            total_price += order_item.quantity * order_item.menu.price

        if order_detail_list:
            return HttpResponse(json.dumps({
                "data": order_detail_list,
                "aggregates": {
                    "price": {
                        "total_price": "%.2f" % total_price
                    }
                }}), content_type="application/json")
        else:
            return HttpResponse("[]", content_type="application/json")

    @staticmethod
    def change_status(request):
        item = json.loads(request.POST.get("item"))

        order = models.Orders.objects.get(id=int(item.get("id")))
        order.status = item.get("new_status")
        order.save()

        return HttpResponse(json.dumps({
            "status": "ok",
            "new_status": order.status
        }), content_type="application/json")