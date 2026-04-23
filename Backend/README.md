# Django + DRF POS Backend

Backend API for the POS frontend in this repository.

## Stack

- Django
- Django REST Framework
- SQLite (default)

## Setup

From the `Backend` folder:

```powershell
.\.venv\Scripts\python.exe -m pip install django djangorestframework django-cors-headers
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py runserver
```

API base URL:

`http://127.0.0.1:8000/api/`

## Production

For the Render backend, set these environment variables:

- `SECRET_KEY`
- `DEBUG=False`
- `FRONTEND_ORIGIN=https://jamboposminiversion.netlify.app`

The backend already defaults to trusting the Netlify origin for CORS and CSRF, but the explicit variable keeps the deployment configuration clear.

## Endpoints

### Products

- `GET /api/products/` list all products
- `POST /api/products/` create a product
- `PUT /api/products/<id>/` update a product
- `DELETE /api/products/<id>/` delete a product

Create product body:

```json
{
	"name": "Espresso",
	"price": "3.50"
}
```

### Sales

- `GET /api/sales/` list all sales
- `POST /api/sales/` record a sale

Sales filters supported on `GET /api/sales/`:

- `period=today|week|month`
- `start_date=YYYY-MM-DD`
- `end_date=YYYY-MM-DD`

Record sale body:

```json
{
	"items": [
		{ "productId": "<uuid>", "quantity": 2 },
		{ "productId": "<uuid>", "quantity": 1 }
	]
}
```

### Dashboard

- `GET /api/dashboard/`

Returns:

- `today_total`
- `sales_count`
- `average_sale`
- `chart_7d` (last 7 days revenue)

Also includes frontend-friendly aliases:

- `todayRevenue`
- `todayCount`
- `avgSale`
- `chart`
