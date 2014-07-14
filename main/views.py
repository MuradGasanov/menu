# -*- coding: utf-8 -*-
import os
from menu import settings

__author__ = 'Murad Gasanov'

from django.shortcuts import render_to_response, HttpResponse, HttpResponseRedirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
import main.models as models
from datetime import *
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
        request.session.set_expiry(timedelta(days=1).seconds)
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

########################################################################################################################


def read_menu(request):
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
