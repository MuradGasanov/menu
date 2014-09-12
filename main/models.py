# -*- coding: utf-8 -*-
from django.db import models
from django.dispatch import receiver
import os


class Categories(models.Model):
    name = models.CharField(max_length=80)
    weight = models.IntegerField(default=0)

    class Meta:
        ordering = ["weight"]
        verbose_name = "Категории"

    def __unicode__(self):
        return unicode(self.name)


def get_upload_folder(instance, filename):
    return os.path.join(
        "%d" % instance.id, filename)


class Menu(models.Model):
    name = models.CharField(max_length=80)
    description = models.TextField(default="")
    price = models.FloatField(default=0)
    image = models.ImageField(upload_to=get_upload_folder, default="default.png", max_length=300)
    category = models.ForeignKey(Categories)

    class Meta:
        verbose_name = "Меню"

    def __unicode__(self):
        return unicode(self.name)


@receiver(models.signals.post_delete, sender=Menu)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """
    Удалить файл при удаление соответствуюшей записи из БД
    """
    if instance.image:
        if instance.image.name != "default.png":
            if os.path.isfile(instance.image.path):
                os.remove(instance.image.path)


@receiver(models.signals.pre_save, sender=Menu)
def auto_delete_file_on_change(sender, instance, **kwargs):
    """
    Удалить файл при изменение соответствуюшей записи из БД
    """
    if not instance.pk:
        return False
    try:
        old_file = Menu.objects.get(pk=instance.pk).image
        if old_file.name != "default.png" and old_file.name != instance.image.name:
            if os.path.isfile(old_file.path):
                os.remove(old_file.path)
    except Menu.DoesNotExist:
        return False


class Customers(models.Model):
    phone = models.CharField(max_length=30)

    class Meta:
        verbose_name = "Клиент"

    def __unicode__(self):
        return unicode(self.phone)


class Orders(models.Model):
    customer = models.ForeignKey(Customers)
    city = models.CharField(max_length=50)
    street = models.CharField(max_length=50)
    house = models.CharField(max_length=20)
    flat = models.CharField(max_length=20)
    comment = models.CharField(max_length=500)
    create_at = models.DateTimeField()

    @property
    def address(self):
        return "".join([self.city, " ", self.street, " ", self.house, " ", self.flat])

    NOT_COMPLETED = 0
    COMPLETED = 1
    NEW = 2
    STATUS_CHOICES = (
        (NOT_COMPLETED, 'Не завершен'),
        (COMPLETED, 'Завершен'),
        (NEW, 'Новый')
    )
    status = models.IntegerField(choices=STATUS_CHOICES, default=NEW)

    class Meta:
        ordering = ["-create_at"]
        verbose_name = "Заказы"

    def __unicode__(self):
        return unicode(self.customer)


class OrderItem(models.Model):
    order = models.ForeignKey(Orders)
    menu = models.ForeignKey(Menu)
    quantity = models.IntegerField()

    class Meta:
        verbose_name = "Заказы (товары)"

    def __unicode__(self):
        return unicode(self.order) + unicode(self.menu)
