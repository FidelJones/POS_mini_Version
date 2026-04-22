from datetime import timedelta

from django.db.models import Avg, Count, Sum
from django.db.models.functions import TruncDate
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, HourlyAggregate, Product, Sale
from .serializers import CategorySerializer, ProductSerializer, SaleCreateSerializer, SaleSerializer


class CategoryListCreateAPIView(generics.ListCreateAPIView):
	queryset = Category.objects.all()
	serializer_class = CategorySerializer


class CategoryDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Category.objects.all()
	serializer_class = CategorySerializer


class ProductListCreateAPIView(generics.ListCreateAPIView):
	queryset = Product.objects.select_related('category').all()
	serializer_class = ProductSerializer

	def get_queryset(self):
		queryset = super().get_queryset()
		category_id = self.request.query_params.get('category')
		if category_id:
			queryset = queryset.filter(category_id=category_id)
		return queryset


class ProductDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Product.objects.select_related('category').all()
	serializer_class = ProductSerializer


class SaleListCreateAPIView(APIView):
	def get(self, request):
		queryset = Sale.objects.prefetch_related('items__product').all()

		period = request.query_params.get('period')
		start_date = request.query_params.get('start_date')
		end_date = request.query_params.get('end_date')

		today = timezone.localdate()
		if period == 'today':
			queryset = queryset.filter(created_at__date=today)
		elif period == 'week':
			queryset = queryset.filter(created_at__date__gte=today - timedelta(days=7))
		elif period == 'month':
			queryset = queryset.filter(created_at__date__gte=today - timedelta(days=30))

		if start_date:
			queryset = queryset.filter(created_at__date__gte=start_date)
		if end_date:
			queryset = queryset.filter(created_at__date__lte=end_date)

		serializer = SaleSerializer(queryset, many=True)
		return Response(serializer.data)

	def post(self, request):
		serializer = SaleCreateSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		sale = serializer.save()
		return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)


class DashboardAPIView(APIView):
	def get(self, request):
		today = timezone.localdate()

		today_sales = Sale.objects.filter(created_at__date=today)
		today_total = today_sales.aggregate(total=Sum('total'))['total'] or 0
		sales_count = today_sales.aggregate(count=Count('id'))['count'] or 0
		average_sale = today_sales.aggregate(avg=Avg('total'))['avg'] or 0

		start_date = today - timedelta(days=6)
		daily_rows = (
			Sale.objects.filter(created_at__date__gte=start_date, created_at__date__lte=today)
			.annotate(day=TruncDate('created_at'))
			.values('day')
			.annotate(revenue=Sum('total'))
			.order_by('day')
		)
		revenue_by_day = {row['day']: row['revenue'] for row in daily_rows}

		chart = []
		for i in range(7):
			day = start_date + timedelta(days=i)
			chart.append(
				{
					'date': day.isoformat(),
					'day': day.strftime('%a'),
					'revenue': float(revenue_by_day.get(day, 0) or 0),
				}
			)

		data = {
			'today_total': float(today_total),
			'sales_count': sales_count,
			'average_sale': float(average_sale),
			'chart_7d': chart,
			# Frontend-friendly aliases if you want to reuse the current dashboard shape.
			'todayRevenue': float(today_total),
			'todayCount': sales_count,
			'avgSale': float(average_sale),
			'chart': chart,
		}
		return Response(data)


class ReportsHeatmapAPIView(APIView):
	def get(self, request):
		date_param = request.query_params.get('date')
		target_date = parse_date(date_param) if date_param else timezone.localdate()
		if date_param and target_date is None:
			return Response({'detail': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

		rows = HourlyAggregate.objects.filter(date=target_date).values('hour', 'sale_count', 'revenue')
		rows_by_hour = {row['hour']: row for row in rows}

		hours = []
		for hour in range(24):
			row = rows_by_hour.get(hour)
			hours.append(
				{
					'hour': hour,
					'sale_count': int(row['sale_count']) if row else 0,
					'revenue': float(row['revenue']) if row else 0.0,
				}
			)

		return Response({'date': target_date.isoformat(), 'hours': hours})
