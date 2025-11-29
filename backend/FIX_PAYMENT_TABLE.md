# إصلاح مشكلة جدول الدفعات

## المشكلة
- Migration 0016 مسجلة في Django لكن الجدول غير موجود فعلياً في قاعدة البيانات
- عند محاولة إضافة دفعة، يحدث 500 error

## الحل السريع

### الطريقة 1: استخدام Management Command (الأسهل)

```bash
cd backend
python manage.py fix_payments
```

### الطريقة 2: استخدام Python Script

```bash
cd backend
python create_payment_table.py
```

### الطريقة 3: الحل اليدوي

#### الخطوة 1: حذف سجل migration
```bash
cd backend
python manage.py shell
```

ثم في Python shell:
```python
from django.db import connection
cursor = connection.cursor()
cursor.execute("DELETE FROM django_migrations WHERE app='projects' AND name='0016_payment'")
connection.commit()
exit()
```

#### الخطوة 2: إنشاء الجدول يدوياً
```bash
python manage.py shell
```

```python
from django.db import connection
cursor = connection.cursor()

# إنشاء الجدول
cursor.execute("""
    CREATE TABLE projects_payment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        amount DECIMAL(14, 2) NOT NULL,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        project_id INTEGER NULL,
        FOREIGN KEY (project_id) REFERENCES projects_project (id) ON DELETE CASCADE
    )
""")

# إنشاء index
cursor.execute("""
    CREATE INDEX projects_payment_project_id_idx 
    ON projects_payment(project_id)
""")

connection.commit()
print("✅ تم إنشاء الجدول!")
exit()
```

#### الخطوة 3: تسجيل migration
```bash
python manage.py migrate projects 0016 --fake
```

## التحقق من الحل

```bash
python manage.py shell
```

```python
from projects.models import Payment
Payment.objects.all()  # يجب أن يعمل بدون أخطاء
print("✅ الجدول يعمل بشكل صحيح!")
exit()
```

## ملاحظات

- بعد إنشاء الجدول، يجب أن يعمل نظام الدفعات بشكل طبيعي
- إذا استمرت المشكلة، تأكد من أن Django server تم إعادة تشغيله
