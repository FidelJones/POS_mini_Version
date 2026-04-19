from django.contrib import admin
from .models import Product, Sale, SaleItem


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
	list_display = ('id', 'name', 'price', 'created_at')
	search_fields = ('name',)


class SaleItemInline(admin.TabularInline):
	model = SaleItem
	extra = 0
	readonly_fields = ('product', 'name_snapshot', 'price_snapshot', 'quantity')


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
	list_display = ('id', 'total', 'created_at')
	inlines = [SaleItemInline]
