# نظام المستخدمين والصلاحيات والموافقات (Authentication & Authorization System)

## نظرة عامة

تم إنشاء نظام كامل لإدارة المستخدمين والصلاحيات والموافقات (Workflow) للمشروع. النظام مرن وديناميكي ويمكن إدارته بالكامل من لوحة التحكم بدون الحاجة لتعديل الكود.

## المميزات

### 1. نظام المستخدمين (Authentication)
- ✅ تسجيل دخول/خروج
- ✅ تشفير كلمات المرور
- ✅ JWT Authentication مع Refresh Token
- ✅ API للحساب الشخصي (Profile)
- ✅ إدارة المستخدمين

### 2. نظام الأدوار والصلاحيات (RBAC)
- ✅ Roles (أدوار): Admin, Manager, Data Entry, Reviewer, Approver
- ✅ Permissions (صلاحيات دقيقة): project.create, project.edit, project.approve, etc.
- ✅ ربط Users بـ Roles
- ✅ APIs لإدارة Roles و Permissions

### 3. نظام مراحل المشروع (Workflow Stages)
- ✅ مراحل ديناميكية قابلة للتعديل
- ✅ قواعد Workflow لكل مرحلة
- ✅ تحديد الصلاحيات لكل إجراء في كل مرحلة

### 4. نظام الموافقات (Approval System)
- ✅ Submit للموافقة
- ✅ Approve / Reject
- ✅ طلب حذف → موافقة الحذف → حذف فعلي

### 5. توثيق العمليات (Audit Trail)
- ✅ تسجيل جميع العمليات
- ✅ من دخل، من عدل، من وافق، من رفض
- ✅ تسجيل IP Address و User Agent

### 6. Frontend Integration
- ✅ Auth Context للصلاحيات
- ✅ Permission Guards
- ✅ Protected Routes
- ✅ إظهار/إخفاء الأزرار بناءً على الصلاحيات

## البنية

### Backend (Django)

#### Models
- `User`: نموذج المستخدم المخصص
- `Role`: الأدوار
- `Permission`: الصلاحيات
- `WorkflowStage`: مراحل Workflow
- `WorkflowRule`: قواعد Workflow
- `AuditLog`: سجل العمليات

#### APIs

**Authentication:**
- `POST /api/auth/login/` - تسجيل الدخول
- `POST /api/auth/token/refresh/` - تحديث Token
- `GET /api/auth/users/profile/` - بيانات المستخدم
- `PUT /api/auth/users/update_profile/` - تحديث الملف الشخصي
- `POST /api/auth/users/logout/` - تسجيل الخروج
- `POST /api/auth/users/register/` - تسجيل مستخدم جديد

**Users Management:**
- `GET /api/auth/users/` - قائمة المستخدمين
- `POST /api/auth/users/` - إنشاء مستخدم
- `GET /api/auth/users/{id}/` - تفاصيل مستخدم
- `PUT /api/auth/users/{id}/` - تحديث مستخدم
- `DELETE /api/auth/users/{id}/` - حذف مستخدم

**Roles & Permissions:**
- `GET /api/auth/roles/` - قائمة الأدوار
- `POST /api/auth/roles/` - إنشاء دور
- `GET /api/auth/permissions/` - قائمة الصلاحيات
- `GET /api/auth/permissions/by_category/` - الصلاحيات مصنفة

**Workflow:**
- `GET /api/auth/workflow-stages/` - قائمة المراحل
- `GET /api/auth/workflow-rules/` - قائمة القواعد
- `GET /api/auth/workflow-rules/by_stage/?stage_id=X` - قواعد مرحلة معينة

**Audit Logs:**
- `GET /api/auth/audit-logs/` - سجل العمليات
- `GET /api/auth/audit-logs/by_model/?model_name=X&object_id=Y` - سجلات لنموذج معين

**Project Workflow Actions:**
- `POST /api/projects/{id}/submit/` - إرسال للموافقة
- `POST /api/projects/{id}/approve/` - الموافقة
- `POST /api/projects/{id}/reject/` - الرفض
- `POST /api/projects/{id}/request_delete/` - طلب حذف
- `POST /api/projects/{id}/approve_delete/` - اعتماد الحذف
- `POST /api/projects/{id}/move_to_stage/` - نقل إلى مرحلة جديدة

### Frontend (React)

#### Components
- `AuthContext`: Context للصلاحيات والمستخدم
- `PermissionGuard`: Component لحماية العناصر
- `ProtectedRoute`: Component لحماية المسارات
- `LoginPage`: صفحة تسجيل الدخول

#### Usage

**استخدام PermissionGuard:**
```jsx
import PermissionGuard from '../components/PermissionGuard';

<PermissionGuard permission="project.create">
  <Button>Create Project</Button>
</PermissionGuard>

<PermissionGuard permissions={['project.edit', 'project.approve']} requireAll={false}>
  <Button>Edit or Approve</Button>
</PermissionGuard>
```

**استخدام ProtectedRoute:**
```jsx
import ProtectedRoute from '../components/ProtectedRoute';

<Route path="/projects" element={
  <ProtectedRoute>
    <ProjectsPage />
  </ProtectedRoute>
} />
```

**استخدام useAuth:**
```jsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, permissions, hasPermission, logout } = useAuth();
  
  if (hasPermission('project.create')) {
    // عرض زر الإنشاء
  }
}
```

## الإعداد

### 1. تثبيت المتطلبات

```bash
cd backend
pip install -r requirements.txt
```

### 2. إنشاء Migrations

```bash
python manage.py makemigrations authentication
python manage.py migrate
```

### 3. إنشاء البيانات الأولية

```bash
python manage.py init_permissions
```

هذا الأمر سينشئ:
- جميع الصلاحيات الأساسية
- الأدوار: Admin, Manager, Data Entry, Reviewer, Approver
- المراحل الأولية: stage_1, stage_2, stage_3
- قواعد Workflow الأساسية

### 4. إنشاء Superuser

```bash
python manage.py createsuperuser
```

### 5. Frontend

لا حاجة لتثبيت حزم إضافية، كل شيء موجود في المشروع.

## الاستخدام

### 1. تسجيل الدخول

افتح `/login` وسجل دخولك.

### 2. إدارة الأدوار والصلاحيات

من لوحة التحكم Django (`/admin`):
- إضافة/تعديل Roles
- إضافة/تعديل Permissions
- ربط Permissions بـ Roles
- ربط Users بـ Roles

### 3. إدارة Workflow

من لوحة التحكم:
- إضافة مراحل جديدة (WorkflowStage)
- إضافة قواعد لكل مرحلة (WorkflowRule)
- تحديد الصلاحيات المطلوبة لكل إجراء

### 4. استخدام الصلاحيات في الكود

**Backend:**
```python
from authentication.decorators import require_permission
from authentication.utils import check_permission

@require_permission('project.create')
def create_project(request):
    ...

# أو في View
if not check_permission(request.user, 'project.approve'):
    return Response({'error': 'Permission denied'}, status=403)
```

**Frontend:**
```jsx
import PermissionGuard from '../components/PermissionGuard';

<PermissionGuard permission="project.create">
  <Button onClick={handleCreate}>Create</Button>
</PermissionGuard>
```

## الصلاحيات الأساسية

### Project Permissions
- `project.create` - إنشاء مشروع
- `project.edit` - تعديل مشروع
- `project.view` - عرض مشروع
- `project.submit` - إرسال للموافقة
- `project.approve` - الموافقة
- `project.reject` - الرفض
- `project.delete_request` - طلب حذف
- `project.delete_approve` - اعتماد الحذف
- `project.approve_stage_1` - اعتماد المرحلة 1
- `project.approve_stage_2` - اعتماد المرحلة 2
- `project.move_to_stage_1` - نقل إلى المرحلة 1
- `project.move_to_stage_2` - نقل إلى المرحلة 2

### File Permissions
- `files.upload` - رفع ملفات
- `files.view` - عرض ملفات
- `files.delete` - حذف ملفات

### User Management Permissions
- `user.create` - إنشاء مستخدم
- `user.edit` - تعديل مستخدم
- `user.view` - عرض مستخدم
- `user.delete` - حذف مستخدم

### Role Management Permissions
- `role.create` - إنشاء دور
- `role.edit` - تعديل دور
- `role.view` - عرض دور
- `role.delete` - حذف دور

## الأدوار الافتراضية

1. **Admin**: جميع الصلاحيات
2. **Manager**: صلاحيات إدارية (إنشاء، تعديل، موافقة)
3. **Data Entry**: إنشاء وتعديل المشاريع
4. **Reviewer**: عرض ومراجعة فقط
5. **Approver**: الموافقة والرفض

## ملاحظات مهمة

1. **Superuser**: لديه جميع الصلاحيات تلقائياً
2. **Dynamic System**: يمكن إضافة صلاحيات ومراحل جديدة من Admin Panel بدون تعديل الكود
3. **Audit Trail**: جميع العمليات مسجلة تلقائياً
4. **Security**: كلمات المرور مشفرة، JWT Tokens آمنة

## التطوير المستقبلي

- [ ] لوحة تحكم Frontend لإدارة الأدوار والصلاحيات
- [ ] إشعارات عند طلب الموافقة
- [ ] تقارير Audit Logs
- [ ] تصدير Audit Logs
- [ ] نظام إشعارات للموافقات

