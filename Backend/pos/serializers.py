from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from .models import Product, Sale, SaleItem


class ProductSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'createdAt']


class SaleItemSerializer(serializers.ModelSerializer):
    productId = serializers.SerializerMethodField()
    name = serializers.CharField(source='name_snapshot', read_only=True)
    price = serializers.DecimalField(source='price_snapshot', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = SaleItem
        fields = ['productId', 'name', 'price', 'quantity']

    def get_productId(self, obj):
        return str(obj.product_id) if obj.product_id else None


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Sale
        fields = ['id', 'items', 'total', 'createdAt']


class SaleCreateItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField(required=False)
    productId = serializers.UUIDField(required=False)
    quantity = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        product_id = attrs.get('product_id') or attrs.get('productId')
        if not product_id:
            raise serializers.ValidationError({'productId': 'productId or product_id is required.'})
        attrs['product_id'] = product_id
        return attrs


class SaleCreateSerializer(serializers.Serializer):
    items = SaleCreateItemSerializer(many=True)

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError('At least one sale item is required.')
        return items

    @transaction.atomic
    def create(self, validated_data):
        sale = Sale.objects.create(total=Decimal('0.00'))
        total = Decimal('0.00')

        product_ids = [item['product_id'] for item in validated_data['items']]
        products = Product.objects.in_bulk(product_ids)

        for item in validated_data['items']:
            product = products.get(item['product_id'])
            if not product:
                raise serializers.ValidationError({'items': [f"Product {item['product_id']} does not exist."]})

            quantity = item['quantity']
            line_total = product.price * quantity
            total += line_total

            SaleItem.objects.create(
                sale=sale,
                product=product,
                name_snapshot=product.name,
                price_snapshot=product.price,
                quantity=quantity,
            )

        sale.total = total
        sale.save(update_fields=['total'])
        return sale
