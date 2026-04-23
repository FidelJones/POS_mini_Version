from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    CategoryDetailAPIView,
    CategoryListCreateAPIView,
    CurrentUserAPIView,
    DashboardAPIView,
    HealthAPIView,
    ProductDetailAPIView,
    ProductListCreateAPIView,
    ReportsHeatmapAPIView,
    SaleListCreateAPIView,
)

urlpatterns = [
    path('health/', HealthAPIView.as_view(), name='health'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserAPIView.as_view(), name='auth_me'),
    path('categories/', CategoryListCreateAPIView.as_view(), name='categories-list-create'),
    path('categories/<uuid:pk>/', CategoryDetailAPIView.as_view(), name='categories-detail'),
    path('products/', ProductListCreateAPIView.as_view(), name='products-list-create'),
    path('products/<uuid:pk>/', ProductDetailAPIView.as_view(), name='products-detail'),
    path('sales/', SaleListCreateAPIView.as_view(), name='sales-list-create'),
    path('dashboard/', DashboardAPIView.as_view(), name='dashboard'),
    path('reports/heatmap/', ReportsHeatmapAPIView.as_view(), name='reports-heatmap'),
]

