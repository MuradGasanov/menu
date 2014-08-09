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

                       url(r'^menu/$', read_menu),
                       url(r'^add_order/$', add_order),

                       )