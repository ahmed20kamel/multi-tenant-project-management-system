import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection

print("=" * 50)
print("إنشاء جدول الدفعات")
print("=" * 50)

cursor = connection.cursor()

# التحقق من وجود الجدول
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='projects_payment'")
exists = cursor.fetchone()

if exists:
    print("✅ الجدول موجود بالفعل!")
else:
    print("🔨 إنشاء الجدول...")
    
    try:
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
        print("✅ تم إنشاء الجدول بنجاح!")
        
        # تسجيل migration
        from django.utils import timezone
        now = timezone.now()
        cursor.execute("""
            INSERT OR IGNORE INTO django_migrations (app, name, applied)
            VALUES ('projects', '0016_payment', ?)
        """, (now,))
        connection.commit()
        print("✅ تم تسجيل migration")
        
    except Exception as e:
        print(f"❌ خطأ: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

# التحقق النهائي
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='projects_payment'")
final_check = cursor.fetchone()

if final_check:
    print("\n" + "=" * 50)
    print("✅ كل شيء جاهز! الجدول موجود ويمكن استخدامه.")
    print("=" * 50)
else:
    print("\n" + "=" * 50)
    print("❌ فشل إنشاء الجدول!")
    print("=" * 50)
    sys.exit(1)
