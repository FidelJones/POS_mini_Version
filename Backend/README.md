# Django + DRF POS Backend

Backend API for the POS frontend in this repository.

## Stack

- Django
- Django REST Framework
- SQLite (default)

## Setup

From the `Backend` folder:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py createsuperuser
.\.venv\Scripts\python.exe manage.py runserver
```

API base URL:

`http://127.0.0.1:8000/api/`

## Production

For the Render backend, set these environment variables:

- `SECRET_KEY`
- `DEBUG=False`
- `FRONTEND_ORIGIN=https://jamboposminiversion.netlify.app`
- `ADMIN_USERNAME=admin` (optional bootstrap)
- `ADMIN_PASSWORD=<your-strong-password>` (optional bootstrap)
- `ADMIN_EMAIL=admin@example.com` (optional bootstrap)
- `CLOUDINARY_CLOUD_NAME=<cloud-name>` (for persistent media)
- `CLOUDINARY_API_KEY=<api-key>` (for persistent media)
- `CLOUDINARY_API_SECRET=<api-secret>` (for persistent media)

The backend already defaults to trusting the Netlify origin for CORS and CSRF, but the explicit variable keeps the deployment configuration clear.

If Cloudinary variables are present, uploads for product/category images use Cloudinary object storage automatically. If they are missing, Django falls back to local `media/` storage.

For Render, use these commands:

- Build Command: `bash render-build.sh`
- Start Command: `bash render-start.sh`

The build script installs dependencies and runs `python manage.py migrate --noinput`, which is required because `db.sqlite3` is not committed to the repository.

If `ADMIN_USERNAME` and `ADMIN_PASSWORD` are provided, the build script also creates or updates a superuser automatically. This is useful on free plans where Render Shell access is not available.

## Endpoints

### Auth

- `GET /api/health/` public backend health check
- `POST /api/auth/token/` obtain access and refresh tokens
- `POST /api/auth/refresh/` refresh access token
- `GET /api/auth/me/` get signed-in user profile

Token request body:

```json
{
	"username": "admin",
	"password": "your-password"
}
```

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
