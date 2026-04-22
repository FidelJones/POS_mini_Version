from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count, Sum
from django.db.models.functions import ExtractHour
from django.utils import timezone
from django.utils.dateparse import parse_date

from pos.models import HourlyAggregate, Sale


class Command(BaseCommand):
    help = "Aggregate sales into HourlyAggregate for a given date (defaults to yesterday)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--date",
            type=str,
            help="Date to aggregate in YYYY-MM-DD format. Defaults to yesterday.",
        )

    def handle(self, *args, **options):
        if options.get("date"):
            target_date = parse_date(options["date"])
            if target_date is None:
                raise CommandError("Invalid date format. Use YYYY-MM-DD.")
        else:
            target_date = timezone.localdate() - timedelta(days=1)

        aggregated = (
            Sale.objects.filter(created_at__date=target_date)
            .annotate(hour=ExtractHour("created_at"))
            .values("hour")
            .annotate(sale_count=Count("id"), revenue=Sum("total"))
        )

        data_by_hour = {row["hour"]: row for row in aggregated}

        for hour in range(24):
            row = data_by_hour.get(hour)
            sale_count = int(row["sale_count"]) if row else 0
            revenue = row["revenue"] if row and row["revenue"] is not None else Decimal("0.00")

            HourlyAggregate.objects.update_or_create(
                date=target_date,
                hour=hour,
                defaults={
                    "sale_count": sale_count,
                    "revenue": revenue,
                },
            )

        self.stdout.write(self.style.SUCCESS(f"Hourly aggregates updated for {target_date.isoformat()}"))
