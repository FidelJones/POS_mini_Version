from django.contrib import admin
from .models import Category, HourlyAggregate, Product, Sale, SaleItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
	list_display = ('id', 'name', 'image', 'created_at')
	search_fields = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
	list_display = ('id', 'name', 'category', 'price', 'image', 'created_at')
	search_fields = ('name',)
	list_filter = ('category',)


class SaleItemInline(admin.TabularInline):
	model = SaleItem
	extra = 0
	readonly_fields = ('product', 'name_snapshot', 'price_snapshot', 'quantity')


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
	list_display = ('id', 'tax_amount', 'total', 'created_at')
	inlines = [SaleItemInline]


@admin.register(HourlyAggregate)
class HourlyAggregateAdmin(admin.ModelAdmin):
	list_display = ('date', 'hour', 'sale_count', 'revenue')
	list_filter = ('date',)
