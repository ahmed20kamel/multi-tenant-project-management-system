# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0016_payment'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='status',
            field=models.CharField(
                choices=[
                    ('not_started', 'Not Yet Started'),
                    ('execution_started', 'Execution Started'),
                    ('under_execution', 'Under Execution'),
                    ('temporarily_suspended', 'Temporarily Suspended'),
                    ('handover_stage', 'In Handover Stage'),
                    ('pending_financial_closure', 'Pending Financial Closure'),
                    ('completed', 'Completed'),
                    ('draft', 'Draft'),
                    ('in_progress', 'In Progress'),
                ],
                default='not_started',
                max_length=30
            ),
        ),
    ]
