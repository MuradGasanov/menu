from django.contrib import admin
from main.models import *

admin.site.register(Categories)
admin.site.register(Menu)
admin.site.register(Customers)
admin.site.register(Orders)
admin.site.register(OrderItem)