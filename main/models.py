# -*- coding: utf-8 -*-
from django.db import models
from django.dispatch import receiver
import os


class Categories(models.Model):
    name = models.CharField(max_length=80)
    weight = models.IntegerField(default=0)

    class Meta:
        ordering = ["weight"]


def get_upload_folder(instance, filename):
    return os.path.join(
        "%d" % instance.id, filename)


class Menu(models.Model):
    name = models.CharField(max_length=80)
    description = models.TextField(default="")
    price = models.FloatField(default=0)
    image = models.ImageField(upload_to=get_upload_folder, default="default.png")
    category = models.ForeignKey(Categories)


@receiver(models.signals.post_delete, sender=Menu)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """
    Удалить файл при удаление соответствуюшей записи из БД
    """
    if instance.image:
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
        os.remove(old_file)
    except Menu.DoesNotExist:
        return False