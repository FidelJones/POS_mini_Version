from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from .models import Product, Sale, SaleItem


class ProductSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'image', 'imageUrl', 'createdAt']
        extra_kwargs = {
            'image': {'required': False, 'allow_null': True},
        }

    def get_imageUrl(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        if request is not None:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


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
    customerName = serializers.CharField(source='customer_name', allow_blank=True)
    notes = serializers.CharField(allow_blank=True)

    class Meta:
        model = Sale
        fields = ['id', 'items', 'total', 'customerName', 'notes', 'createdAt']


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
    customer_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError('At least one sale item is required.')
        return items

    @transaction.atomic
    def create(self, validated_data):
        customer_name = validated_data.get('customer_name', '')
        notes = validated_data.get('notes', '')
        sale = Sale.objects.create(total=Decimal('0.00'), customer_name=customer_name, notes=notes)
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
