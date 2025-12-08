# 🏢 Multi-Tenant SaaS Project Management System

نظام إدارة مشاريع متعدد الشركات (Multi-Tenant SaaS) لإدارة مشاريع المقاولات.

## 📋 Overview

هذا المشروع هو نظام SaaS متكامل لإدارة مشاريع المقاولات، يدعم:
- إدارة متعددة الشركات (Multi-Tenant)
- نظام صلاحيات متقدم (RBAC)
- إدارة المشاريع والدفعات
- واجهة مستخدم حديثة ومتجاوبة

## 🏗️ Project Structure

```
eng-hayder/
├── frontend/          # React Frontend Application
├── backend/           # Django Backend API
├── PROJECT_STRUCTURE.md    # Detailed project structure
└── ORGANIZATION_PLAN.md    # Organization plan
```

## 🚀 Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## 📚 Documentation

- [Project Structure](PROJECT_STRUCTURE.md) - Detailed project structure
- [Organization Plan](ORGANIZATION_PLAN.md) - Organization and refactoring plan
- [Frontend README](frontend/README.md) - Frontend documentation
- [Backend README](backend/README.md) - Backend documentation

## 🎯 Features

### Core Features
- ✅ Multi-tenant architecture
- ✅ User authentication & authorization
- ✅ Role-based access control (RBAC)
- ✅ Project management
- ✅ Payment tracking
- ✅ File upload & management
- ✅ Internationalization (Arabic/English)
- ✅ Theme customization per company

### Admin Features
- ✅ Company management
- ✅ User management
- ✅ Subscription management
- ✅ System settings

### Company Features
- ✅ Project creation & management
- ✅ Payment tracking
- ✅ Owner & consultant management
- ✅ Company settings & branding

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Axios
- i18next
- Material-UI

### Backend
- Django 5.1
- Django REST Framework
- djangorestframework-simplejwt
- Pillow
- SQLite (development)

## 📁 Key Directories

### Frontend
- `src/components/` - Reusable UI components
- `src/features/` - Feature-based modules
- `src/services/` - API services
- `src/utils/` - Utility functions

### Backend
- `apps/authentication/` - Authentication & user management
- `apps/projects/` - Project management
- `media/` - User-uploaded files

## 🔐 Default Users

### Super Admin
- Username: `administrator`
- Password: `k@rma311997a@`

### Company Admin (Yafoor)
- Username: `ahmed`
- Password: `Yaf@12345$`

## 📝 Development Notes

- Use feature-based organization for frontend
- Keep backend apps self-contained
- Follow naming conventions (PascalCase for components, camelCase for utilities)
- Document complex functions with JSDoc

## 🤝 Contributing

1. Follow the project structure guidelines
2. Write clear commit messages
3. Test your changes before committing
4. Update documentation as needed

## 📄 License

Proprietary - All rights reserved

