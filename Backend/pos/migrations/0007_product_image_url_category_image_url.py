from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pos', '0006_hourlyaggregate'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='image_url',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='product',
            name='image_url',
            field=models.TextField(blank=True, default=''),
        ),
    ]
