# 📋 خطة تنظيم المشروع

هذا الملف يوضح خطة تنظيم المشروع والخطوات المطلوبة.

---

## ✅ الوضع الحالي

### Frontend
- ✅ الهيكل الأساسي منظم بشكل جيد
- ✅ Features منظمة في مجلدات منفصلة
- ✅ Components منظمة حسب النوع
- ⚠️ بعض الملفات المكررة (api.js في config/ و services/)
- ⚠️ بعض المجلدات الفارغة (formatters/, helpers/, validators/)

### Backend
- ✅ Django apps منظمة بشكل جيد
- ✅ Migrations منظمة
- ⚠️ ملفات views.py و serializers.py كبيرة جداً
- ⚠️ بعض الملفات القديمة غير المستخدمة

---

## 🎯 الخطوات المطلوبة

### 1. Frontend Organization

#### أ. تنظيم Services
- [x] إنشاء `services/README.md`
- [ ] نقل `api.js` من `config/` إلى `services/` (أو توحيدهما)
- [ ] إنشاء service files منفصلة:
  - `services/auth.js` - Authentication endpoints
  - `services/projects.js` - Projects endpoints
  - `services/tenants.js` - Tenants endpoints

#### ب. تنظيم Utils
- [x] إنشاء `utils/README.md`
- [ ] نقل الملفات إلى مجلدات فرعية:
  - `utils/formatters/` - جميع دوال التنسيق
  - `utils/validators/` - جميع دوال التحقق
  - `utils/helpers/` - جميع الدوال المساعدة
- [ ] إنشاء `utils/index.js` لتصدير جميع الـ utils

#### ج. تنظيف الملفات المكررة
- [ ] إزالة `pages/public/LoginPage.jsx` (مكرر مع CompanyLoginPage)
- [ ] توحيد `components/layout/NavBar.jsx` و `Sidebar.jsx` (إذا كانت غير مستخدمة)
- [ ] إزالة الملفات القديمة غير المستخدمة

### 2. Backend Organization

#### أ. فصل Views
- [ ] إنشاء `authentication/views/`:
  - `auth.py` - Authentication views
  - `users.py` - User management views
  - `tenants.py` - Tenant management views
  - `roles.py` - Role management views
  - `public.py` - Public API views
- [ ] نقل الكود من `views.py` إلى الملفات المناسبة

#### ب. فصل Serializers
- [ ] إنشاء `authentication/serializers/`:
  - `user.py` - User serializers
  - `tenant.py` - Tenant serializers
  - `role.py` - Role serializers
  - `auth.py` - Auth serializers
- [ ] نقل الكود من `serializers.py` إلى الملفات المناسبة

#### ج. تنظيف الملفات القديمة
- [ ] إزالة `create_auth_tables.py`
- [ ] إزالة `recreate_auth_tables.py`
- [ ] إزالة `fix_migration.py`
- [ ] نقل `setup_initial_data.py` إلى `authentication/management/commands/`

### 3. Documentation

- [x] إنشاء `PROJECT_STRUCTURE.md`
- [x] إنشاء `services/README.md`
- [x] إنشاء `utils/README.md`
- [ ] إنشاء `backend/README.md`
- [ ] إنشاء `frontend/README.md`
- [ ] إنشاء `README.md` في كل feature folder

---

## 📝 ملاحظات

1. **لا تحذف الملفات مباشرة**: تأكد من أن الملفات غير مستخدمة قبل الحذف
2. **اختبار بعد كل خطوة**: تأكد من أن التطبيق يعمل بعد كل تغيير
3. **Git commits**: قم بعمل commit بعد كل خطوة رئيسية

---

## 🚀 الأولويات

### عالية الأولوية
1. ✅ إنشاء ملفات README
2. ⏳ تنظيم services
3. ⏳ تنظيم utils

### متوسطة الأولوية
4. ⏳ فصل Backend views
5. ⏳ فصل Backend serializers

### منخفضة الأولوية
6. ⏳ تنظيف الملفات القديمة
7. ⏳ إزالة الملفات المكررة

