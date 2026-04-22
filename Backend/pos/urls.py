from django.urls import path

from .views import (
    CategoryDetailAPIView,
    CategoryListCreateAPIView,
    DashboardAPIView,
    ProductDetailAPIView,
    ProductListCreateAPIView,
    SaleListCreateAPIView,
)

urlpatterns = [
    path('categories/', CategoryListCreateAPIView.as_view(), name='categories-list-create'),
    path('categories/<uuid:pk>/', CategoryDetailAPIView.as_view(), name='categories-detail'),
    path('products/', ProductListCreateAPIView.as_view(), name='products-list-create'),
    path('products/<uuid:pk>/', ProductDetailAPIView.as_view(), name='products-detail'),
    path('sales/', SaleListCreateAPIView.as_view(), name='sales-list-create'),
    path('dashboard/', DashboardAPIView.as_view(), name='dashboard'),
]

