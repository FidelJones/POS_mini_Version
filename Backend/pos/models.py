from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
import uuid


class Product(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	category = models.ForeignKey('Category', on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
	name = models.CharField(max_length=200)
	price = models.DecimalField(max_digits=10, decimal_places=2)
	image = models.ImageField(upload_to='products/', blank=True, null=True)
	image_url = models.TextField(blank=True, default='')
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']

	def __str__(self):
		return self.name


class Category(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	name = models.CharField(max_length=120, unique=True)
	image = models.ImageField(upload_to='categories/', blank=True, null=True)
	image_url = models.TextField(blank=True, default='')
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['name']

	def __str__(self):
		return self.name


class Sale(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	customer_name = models.CharField(max_length=255, blank=True, default='')
	notes = models.TextField(blank=True, default='')
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']

	def __str__(self):
		return f"Sale {self.id}"


class SaleItem(models.Model):
	sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
	product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
	name_snapshot = models.CharField(max_length=200)
	price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)
	quantity = models.PositiveIntegerField()

	def __str__(self):
		return f"{self.quantity} x {self.name_snapshot}"


class HourlyAggregate(models.Model):
	date = models.DateField(db_index=True)
	hour = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(23)])
	sale_count = models.PositiveIntegerField(default=0)
	revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)

	class Meta:
		ordering = ['-date', 'hour']
		constraints = [
			models.UniqueConstraint(fields=['date', 'hour'], name='unique_hourly_aggregate_date_hour'),
		]

	def __str__(self):
		return f"{self.date} {self.hour:02d}:00"
