# 📁 Project Structure - Multi-Tenant SaaS System

هذا الملف يوضح الهيكل الكامل للمشروع والتنظيم المتبع.

---

## 🎯 Frontend Structure (`frontend/`)

```
frontend/
├── public/                          # Static files served directly
│   ├── logo.png                     # Main system logo
│   └── vite.svg                     # Vite logo
│
├── src/
│   ├── main.jsx                     # Application entry point
│   ├── App.jsx                      # Root component & routing
│   ├── index.css                    # Global styles
│   │
│   ├── assets/                      # Static assets (images, icons)
│   │   └── react.svg
│   │
│   ├── config/                      # Configuration files
│   │   ├── api.js                   # API client configuration
│   │   └── i18n.js                  # Internationalization setup
│   │
│   ├── contexts/                     # React Context providers
│   │   └── AuthContext.jsx          # Authentication context
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── common/                  # Common components
│   │   │   ├── Button.jsx           # Button component
│   │   │   ├── Card.jsx             # Card component
│   │   │   └── Dialog.jsx           # Dialog/Modal component
│   │   │
│   │   ├── fields/                  # Form field components
│   │   │   ├── Field.jsx            # Base field component
│   │   │   ├── FormField.jsx        # Form field wrapper
│   │   │   ├── NumberField.jsx      # Number input field
│   │   │   ├── ReadOnlyField.jsx    # Read-only field
│   │   │   ├── RtlSelect.jsx        # RTL-compatible select
│   │   │   └── ViewRow.jsx          # View row component
│   │   │
│   │   ├── forms/                   # Form components
│   │   │   ├── DateDisplay.jsx      # Date display component
│   │   │   └── NumberDisplay.jsx    # Number display component
│   │   │
│   │   ├── layout/                   # Layout components
│   │   │   ├── Layout.jsx            # Main layout wrapper
│   │   │   ├── AdminNavbar.jsx      # Admin navbar
│   │   │   ├── AdminSidebar.jsx     # Admin sidebar
│   │   │   ├── CompanyNavbar.jsx    # Company navbar
│   │   │   ├── CompanySidebar.jsx   # Company sidebar
│   │   │   ├── Breadcrumbs.jsx      # Breadcrumb navigation
│   │   │   └── PageLayout.jsx       # Page layout wrapper
│   │   │
│   │   ├── file-upload/             # File upload components
│   │   │   ├── FileUpload.jsx       # Basic file upload
│   │   │   ├── FileUploadAuto.jsx   # Auto-upload component
│   │   │   ├── FileUploadWithProgress.jsx
│   │   │   └── FileAttachmentView.jsx
│   │   │
│   │   └── ui/                      # UI utility components
│   │       ├── Chips.jsx            # Chip component
│   │       ├── LanguageSwitcher.jsx # Language switcher
│   │       ├── PermissionGuard.jsx  # Permission guard
│   │       ├── ProtectedRoute.jsx   # Protected route wrapper
│   │       └── ViewPageHeader.jsx   # View page header
│   │
│   ├── features/                     # Feature-based modules
│   │   ├── admin/                    # Admin features
│   │   │   ├── pages/
│   │   │   │   ├── AdminDashboardPage.jsx
│   │   │   │   ├── AdminLoginPage.jsx
│   │   │   │   ├── AdminCreateCompanyPage.jsx
│   │   │   │   └── AdminTenantsPage.jsx
│   │   │   └── components/           # Admin-specific components
│   │   │
│   │   ├── auth/                     # Authentication features
│   │   │   ├── pages/
│   │   │   │   ├── CompanyLoginPage.jsx
│   │   │   │   ├── CompanyRegistrationPage.jsx
│   │   │   │   └── OnboardingWizardPage.jsx
│   │   │   └── components/           # Auth-specific components
│   │   │
│   │   ├── company/                  # Company management
│   │   │   ├── pages/
│   │   │   │   ├── CompanySettingsPage.jsx
│   │   │   │   └── CompanyUsersPage.jsx
│   │   │   └── components/
│   │   │
│   │   ├── projects/                 # Project management
│   │   │   ├── pages/
│   │   │   │   ├── ProjectsPage.jsx
│   │   │   │   └── ProjectView.jsx
│   │   │   ├── wizard/               # Project creation wizard
│   │   │   │   ├── WizardPage.jsx
│   │   │   │   ├── steps/
│   │   │   │   │   ├── ProjectSetupStep.jsx
│   │   │   │   │   ├── SitePlanStep.jsx
│   │   │   │   │   ├── LicenseStep.jsx
│   │   │   │   │   ├── ContractStep.jsx
│   │   │   │   │   ├── AwardingStep.jsx
│   │   │   │   │   └── SummaryStep.jsx
│   │   │   │   ├── components/
│   │   │   │   │   ├── WizardShell.jsx
│   │   │   │   │   ├── StepActions.jsx
│   │   │   │   │   └── ...
│   │   │   │   └── hooks/
│   │   │   │       └── useWizardState.js
│   │   │   └── view/                 # Project view pages
│   │   │       ├── ViewSetup.jsx
│   │   │       ├── ViewSitePlan.jsx
│   │   │       ├── ViewLicense.jsx
│   │   │       ├── ViewContract.jsx
│   │   │       ├── ViewAwarding.jsx
│   │   │       └── ViewSummary.jsx
│   │   │
│   │   ├── payments/                 # Payment management
│   │   │   └── pages/
│   │   │       └── PaymentsPage.jsx
│   │   │
│   │   ├── owners/                   # Owner management
│   │   │   └── pages/
│   │   │       ├── OwnersPage.jsx
│   │   │       └── OwnerDetailPage.jsx
│   │   │
│   │   ├── consultants/              # Consultant management
│   │   │   └── pages/
│   │   │       ├── ConsultantsPage.jsx
│   │   │       └── ConsultantDetailPage.jsx
│   │   │
│   │   └── profile/                  # User profile
│   │       └── pages/
│   │           └── ProfilePage.jsx
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.js                # Authentication hook
│   │   ├── useProject.js             # Project data hook
│   │   ├── useContract.js            # Contract data hook
│   │   ├── useLicense.js             # License data hook
│   │   ├── useSitePlan.js            # Site plan data hook
│   │   ├── useFileUpload.js           # File upload hook
│   │   └── useTheme.js                # Theme management hook
│   │
│   ├── services/                     # API services
│   │   ├── api.js                    # Main API client
│   │   ├── auth.js                   # Auth API endpoints
│   │   ├── projects.js               # Projects API endpoints
│   │   └── tenants.js                # Tenants API endpoints
│   │
│   ├── styles/                       # Global styles
│   │   ├── design-system.css         # Design system tokens
│   │   ├── components.css            # Component styles
│   │   └── pages.css                 # Page-specific styles
│   │
│   └── utils/                        # Utility functions
│       ├── constants.js              # App constants
│       ├── dateHelpers.js            # Date utilities
│       ├── fileHelpers.js            # File utilities
│       ├── formatters.js             # Formatting utilities
│       ├── helpers.js                # General helpers
│       ├── validators.js             # Validation utilities
│       ├── errorHandler.js           # Error handling
│       └── localStorage.js           # LocalStorage utilities
│
├── package.json                      # Dependencies
├── vite.config.js                    # Vite configuration
└── README.md                         # Frontend documentation
```

---

## 🎯 Backend Structure (`backend/`)

```
backend/
├── backend/                          # Django project settings
│   ├── __init__.py
│   ├── settings.py                   # Main settings file
│   ├── urls.py                       # Root URL configuration
│   ├── wsgi.py                       # WSGI configuration
│   └── asgi.py                       # ASGI configuration
│
├── apps/                              # Django applications
│   │
│   ├── authentication/               # Authentication & User Management
│   │   ├── __init__.py
│   │   ├── admin.py                  # Django admin configuration
│   │   ├── apps.py                   # App configuration
│   │   │
│   │   ├── models.py                 # All models (User, Tenant, Role, etc.)
│   │   │
│   │   ├── serializers/              # DRF serializers
│   │   │   ├── __init__.py
│   │   │   ├── user.py               # User serializers
│   │   │   ├── tenant.py              # Tenant serializers
│   │   │   ├── role.py                # Role serializers
│   │   │   └── auth.py                # Auth serializers
│   │   │
│   │   ├── views/                     # API views
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                # Authentication views
│   │   │   ├── users.py               # User management views
│   │   │   ├── tenants.py             # Tenant management views
│   │   │   ├── roles.py               # Role management views
│   │   │   └── public.py              # Public API views
│   │   │
│   │   ├── urls.py                    # URL routing
│   │   ├── public_urls.py             # Public URL routing
│   │   │
│   │   ├── middleware.py              # Custom middleware
│   │   ├── utils.py                   # Utility functions
│   │   ├── decorators.py              # Custom decorators
│   │   │
│   │   ├── migrations/                # Database migrations
│   │   │   └── ...
│   │   │
│   │   └── management/                # Management commands
│   │       └── commands/
│   │           ├── create_super_admin.py
│   │           ├── setup_base_users.py
│   │           ├── setup_company_roles.py
│   │           └── ...
│   │
│   └── projects/                      # Project Management
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       │
│       ├── models.py                   # Project models
│       │
│       ├── serializers/               # Project serializers
│       │   ├── __init__.py
│       │   ├── project.py
│       │   ├── site_plan.py
│       │   ├── license.py
│       │   ├── contract.py
│       │   └── awarding.py
│       │
│       ├── views/                     # Project views
│       │   ├── __init__.py
│       │   ├── project.py
│       │   ├── site_plan.py
│       │   ├── license.py
│       │   ├── contract.py
│       │   └── awarding.py
│       │
│       ├── urls.py                    # Project URLs
│       ├── signals.py                 # Django signals
│       │
│       ├── migrations/                # Migrations
│       │   └── ...
│       │
│       └── management/                # Management commands
│           └── commands/
│               └── ...
│
├── core/                              # Core utilities (optional)
│   ├── __init__.py
│   ├── exceptions.py                  # Custom exceptions
│   ├── permissions.py                 # Custom permissions
│   └── pagination.py                  # Custom pagination
│
├── media/                             # User-uploaded files
│   ├── users/avatars/                 # User avatars
│   ├── tenants/logos/                 # Company logos
│   ├── tenants/backgrounds/           # Company backgrounds
│   ├── projects/                     # Project files
│   │   ├── siteplans/
│   │   ├── licenses/
│   │   ├── contracts/
│   │   └── awarding/
│   └── owners/ids/                   # Owner ID documents
│
├── static/                            # Static files (CSS, JS, images)
│
├── requirements.txt                   # Python dependencies
├── manage.py                          # Django management script
└── README.md                          # Backend documentation
```

---

## 📋 Organization Rules

### Frontend Organization

1. **Feature-Based Structure**: كل feature له مجلد خاص يحتوي على:
   - `pages/`: صفحات الـ feature
   - `components/`: مكونات خاصة بالـ feature
   - `hooks/`: hooks خاصة بالـ feature (إن وجدت)
   - `services/`: API calls خاصة بالـ feature (إن وجدت)

2. **Shared Components**: المكونات المشتركة في `components/`:
   - `common/`: مكونات عامة (Button, Card, Dialog)
   - `fields/`: حقول النماذج
   - `layout/`: مكونات التخطيط
   - `ui/`: مكونات UI مساعدة

3. **Utils Organization**: الـ utils منظمة حسب الوظيفة:
   - `constants.js`: ثوابت التطبيق
   - `dateHelpers.js`: دوال التاريخ
   - `fileHelpers.js`: دوال الملفات
   - `formatters.js`: دوال التنسيق
   - `validators.js`: دوال التحقق

### Backend Organization

1. **App-Based Structure**: كل Django app منظم بشكل مستقل:
   - `models.py`: جميع الـ models (أو `models/` إذا كان كبيراً)
   - `serializers/`: serializers منفصلة حسب الـ resource
   - `views/`: views منفصلة حسب الـ resource
   - `urls.py`: URL routing
   - `utils.py`: دوال مساعدة

2. **Separation of Concerns**:
   - Models: منطق البيانات
   - Serializers: تحويل البيانات
   - Views: منطق الـ API
   - Utils: دوال مساعدة

---

## 🎯 Best Practices

1. **Naming Conventions**:
   - Components: `PascalCase` (e.g., `UserProfile.jsx`)
   - Files: `PascalCase` for components, `camelCase` for utilities
   - Folders: `lowercase` with dashes if needed

2. **File Organization**:
   - One component per file
   - Related files grouped together
   - Clear separation between features

3. **Code Structure**:
   - Imports at the top
   - Constants before functions
   - Exports at the bottom

4. **Documentation**:
   - README.md in each major folder
   - JSDoc comments for complex functions
   - Clear variable and function names

---

## 📝 Notes

- هذا الهيكل قابل للتوسع والنمو
- يمكن إضافة features جديدة بسهولة
- المكونات المشتركة في مكان واضح
- كل feature مستقل ويمكن العمل عليه بشكل منفصل
