from django.db import models
import uuid


class Product(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	name = models.CharField(max_length=200)
	price = models.DecimalField(max_digits=10, decimal_places=2)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']

	def __str__(self):
		return self.name


class Sale(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
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
