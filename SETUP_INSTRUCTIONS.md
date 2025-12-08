# تعليمات إعداد النظام (SaaS Multi-Tenant Setup)

## 📋 الخطوات المطلوبة

### 1. حذف جميع المستخدمين الحاليين

```bash
cd backend
python manage.py reset_users
```

**ملاحظة:** لحذف جميع المستخدمين بما في ذلك Superuser، استخدم:
```bash
python manage.py reset_users --force
```

### 2. إنشاء المستخدمين الأساسيين

```bash
python manage.py setup_base_users
```

سيتم إنشاء:
- **administrator** (Super Admin للنظام)
  - Email: `administrator@system.local`
  - Password: `k@rma311997a@`
  - Role: `super_admin`
  
- **ahmed** (Company Super Admin لليافور)
  - Email: `ahmed@yafoor.com`
  - Password: `Yaf@12345$`
  - Role: `company_super_admin`
  - Tenant: اليافور

### 3. تطبيق Migrations

```bash
python manage.py migrate
```

### 4. تشغيل السيرفرات

**Backend:**
```bash
cd backend
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## 🔐 بيانات تسجيل الدخول

### Super Admin (Global Admin)
- **Email:** `administrator@system.local`
- **Password:** `k@rma311997a@`
- **Dashboard:** `/admin/dashboard`

### Company Admin (اليافور)
- **Email:** `ahmed@yafoor.com`
- **Password:** `Yaf@12345$`
- **Dashboard:** `/dashboard`

## 🎯 الميزات المضافة

### 1. Limits System
- **max_users:** الحد الأقصى لعدد المستخدمين
- **max_projects:** الحد الأقصى لعدد المشاريع
- **subscription_status:** حالة الاشتراك (active, suspended, expired, trial)
- **subscription_start_date / subscription_end_date:** تواريخ الاشتراك

### 2. Roles
- **super_admin:** مدير النظام العام
- **company_super_admin:** مدير الشركة الداخلي
- **project_manager, engineer, accountant, viewer:** أدوار الشركة

### 3. Admin Pages
- `/admin/dashboard` - لوحة تحكم السوبر أدمن
- `/admin/tenants` - إدارة الشركات والحدود

## ⚠️ ملاحظات مهمة

1. **Super Admin** لا يرى أي Theme خاص بشركة
2. **Company Admin** يرى فقط بيانات شركته
3. **Limits** يتم تطبيقها تلقائياً عند:
   - إضافة مستخدم جديد
   - إنشاء مشروع جديد
4. **Company Super Admin** يمكنه إضافة مستخدمين فقط داخل شركته

