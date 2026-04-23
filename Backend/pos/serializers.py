from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from rest_framework import serializers

from .models import Category, Product, Sale, SaleItem


class CategorySerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    imageUrl = serializers.CharField(source='image_url', required=False, allow_blank=True, allow_null=True)
    productCount = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'image', 'imageUrl', 'productCount', 'createdAt']
        extra_kwargs = {
            'image': {'required': False, 'allow_null': True},
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('imageUrl'):
            return data

        # Backward compatibility for old rows that only used ImageField storage.
        if instance.image:
            request = self.context.get('request')
            data['imageUrl'] = request.build_absolute_uri(instance.image.url) if request is not None else instance.image.url
        else:
            data['imageUrl'] = None
        return data

    def get_productCount(self, obj):
        return obj.products.count()


class ProductSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    imageUrl = serializers.CharField(source='image_url', required=False, allow_blank=True, allow_null=True)
    categoryId = serializers.PrimaryKeyRelatedField(source='category', queryset=Category.objects.all(), required=False, allow_null=True)
    categoryName = serializers.SerializerMethodField()
    categoryImageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'categoryId', 'categoryName', 'categoryImageUrl', 'image', 'imageUrl', 'createdAt']
        extra_kwargs = {
            'image': {'required': False, 'allow_null': True},
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('imageUrl'):
            return data

        # Backward compatibility for old rows that only used ImageField storage.
        if instance.image:
            request = self.context.get('request')
            data['imageUrl'] = request.build_absolute_uri(instance.image.url) if request is not None else instance.image.url
        else:
            data['imageUrl'] = None
        return data

    def get_categoryName(self, obj):
        return obj.category.name if obj.category else None

    def get_categoryImageUrl(self, obj):
        if not obj.category:
            return None
        if obj.category.image_url:
            return obj.category.image_url
        if not obj.category.image:
            return None
        request = self.context.get('request')
        if request is not None:
            return request.build_absolute_uri(obj.category.image.url)
        return obj.category.image.url


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
    taxAmount = serializers.DecimalField(source='tax_amount', max_digits=12, decimal_places=2, read_only=True)
    notes = serializers.CharField(allow_blank=True)

    class Meta:
        model = Sale
        fields = ['id', 'items', 'total', 'taxAmount', 'customerName', 'notes', 'createdAt']


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
        sale = Sale.objects.create(total=Decimal('0.00'), tax_amount=Decimal('0.00'), customer_name=customer_name, notes=notes)
        subtotal = Decimal('0.00')

        product_ids = [item['product_id'] for item in validated_data['items']]
        products = Product.objects.in_bulk(product_ids)

        for item in validated_data['items']:
            product = products.get(item['product_id'])
            if not product:
                raise serializers.ValidationError({'items': [f"Product {item['product_id']} does not exist."]})

            quantity = item['quantity']
            line_total = product.price * quantity
            subtotal += line_total

            SaleItem.objects.create(
                sale=sale,
                product=product,
                name_snapshot=product.name,
                price_snapshot=product.price,
                quantity=quantity,
            )

        tax_amount = (subtotal * Decimal('0.18')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        total = subtotal + tax_amount
        sale.total = total
        sale.tax_amount = tax_amount
        sale.save(update_fields=['total', 'tax_amount'])
        return sale
