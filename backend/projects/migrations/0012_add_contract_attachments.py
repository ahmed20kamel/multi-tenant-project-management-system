# Generated migration for adding attachments field to Contract model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0011_remove_project_source_of_project_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='contract',
            name='attachments',
            field=models.JSONField(blank=True, default=list, help_text='مرفقات العقد الديناميكية'),
        ),
    ]

