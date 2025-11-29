// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";

// صفحات رئيسية
import HomePage from "./pages/HomePage";
import ProjectsPage from "./pages/ProjectsPage";
import PaymentsPage from "./pages/PaymentsPage";
import OwnersPage from "./pages/OwnersPage";
import ConsultantsPage from "./pages/ConsultantsPage";
import ContractorsPage from "./pages/ContractorsPage";
import ContractorDetailPage from "./pages/ContractorDetailPage";

// المعالج
import WizardPage from "./pages/wizard/WizardPage";

// صفحات العرض - موحدة في pages/view/
import ViewSetup from "./pages/view/ViewSetup";
import ViewSitePlan from "./pages/view/ViewSitePlan";
import ViewLicense from "./pages/view/ViewLicense";
import ViewContract from "./pages/view/ViewContract";
import ViewAwarding from "./pages/view/ViewAwarding";
import ViewSummary from "./pages/view/ViewSummary";

// صفحة عرض المشروع
import ProjectView from "./pages/ProjectView";

// صفحات الملاك والاستشاريين
import OwnerDetailPage from "./pages/OwnerDetailPage";
import ConsultantDetailPage from "./pages/ConsultantDetailPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* الرئيسية */}
        <Route path="/" element={<HomePage />} />

        {/* قائمة المشاريع */}
        <Route path="/projects" element={<ProjectsPage />} />

        {/* قائمة الدفعات */}
        <Route path="/payments" element={<PaymentsPage />} />

        {/* قائمة الملاك */}
        <Route path="/owners" element={<OwnersPage />} />

        {/* قائمة الاستشاريين */}
        <Route path="/consultants" element={<ConsultantsPage />} />

        {/* قائمة المقاولين */}
        <Route path="/contractors" element={<ContractorsPage />} />

        {/* محاولة فتح المعالج بدون projectId → رجوع للقائمة */}
        <Route path="/projects/wizard" element={<Navigate to="/projects" replace />} />

        {/* المعالج لمشروع جديد (بدون إنشاء فوري) */}
        <Route path="/wizard/new" element={<WizardPage />} />

        {/* المعالج بمشروع محدد */}
        <Route path="/projects/:projectId/wizard" element={<WizardPage />} />

        {/* صفحة عرض المشروع (الكروت) */}
        <Route path="/projects/:projectId" element={<ProjectView />} />

        {/* صفحات العرض المنفصلة لكل مرحلة */}
        <Route path="/projects/:projectId/setup/view" element={<ViewSetup />} />
        <Route path="/projects/:projectId/siteplan/view" element={<ViewSitePlan />} />
        <Route path="/projects/:projectId/license/view" element={<ViewLicense />} />
        <Route path="/projects/:projectId/contract/view" element={<ViewContract />} />
        <Route path="/projects/:projectId/awarding/view" element={<ViewAwarding />} />

        {/* الملخص المالي */}
        <Route path="/projects/:projectId/summary" element={<ViewSummary />} />

        {/* صفحات الملاك والاستشاريين والمقاولين */}
        <Route path="/owners/:ownerName" element={<OwnerDetailPage />} />
        <Route path="/consultants/:consultantName" element={<ConsultantDetailPage />} />
        <Route path="/contractors/:contractorName" element={<ContractorDetailPage />} />

        {/* أي مسار غير معروف */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
