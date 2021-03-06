# -*- coding: utf-8 -*-

__author__ = 'Murad Gasanov'

from django.conf.urls import patterns, url
from main.views import *

MANAGER_BASE_URL = "manager/"

urlpatterns = patterns('main.views',
                       url(r'^$', menu_page),
                       url(r'^'+MANAGER_BASE_URL+'$', manager_page),
                       url(r'^login/$', log_in),
                       url(r'^logout/$', log_out),

                       url(r'^'+MANAGER_BASE_URL+'categories/read/$', Categories.read),
                       url(r'^'+MANAGER_BASE_URL+'categories/create/$', Categories.create),
                       url(r'^'+MANAGER_BASE_URL+'categories/update/$', Categories.update),
                       url(r'^'+MANAGER_BASE_URL+'categories/destroy/$', Categories.destroy),

                       url(r'^'+MANAGER_BASE_URL+'menu/read/$', Menu.read),
                       url(r'^'+MANAGER_BASE_URL+'menu/create/$', Menu.create),
                       url(r'^'+MANAGER_BASE_URL+'menu/update/$', Menu.update),
                       url(r'^'+MANAGER_BASE_URL+'menu/destroy/$', Menu.destroy),
                       url(r'^'+MANAGER_BASE_URL+'menu/image/set/$', Menu.image_set),
                       # url(r'^'+MANAGER_BASE_URL+'menu/image/delete/$', Menu.image_delete),

                       url(r'^'+MANAGER_BASE_URL+'orders/read/$', Orders.read),
                       url(r'^'+MANAGER_BASE_URL+'orders/destroy/$', Orders.destroy),
                       url(r'^'+MANAGER_BASE_URL+'orders/detail/$', Orders.detail),
                       url(r'^'+MANAGER_BASE_URL+'orders/change_status/$', Orders.change_status),
                       url(r'^'+MANAGER_BASE_URL+'orders/check_orders/$', Orders.check_new_order),

                       url(r'^menu/$', Menu.user_read),
                       url(r'^add_order/$', Orders.add_order),

                       )