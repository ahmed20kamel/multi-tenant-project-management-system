import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "../../../components/common/Button";
import PageLayout from "../../../components/layout/PageLayout";
import ViewPageHeader from "../../../components/ui/ViewPageHeader";
import useProject from "../../../hooks/useProject";
import ProjectSetupStep from "../wizard/steps/ProjectSetupStep";

export default function ViewSetup() {
  const { projectId } = useParams();
  const { t } = useTranslation();
  const { project, loading, error, reload } = useProject(projectId);

  // ✅ حالة محلية لبيانات إعداد المشروع حتى نسمح بالتعديل داخل الصفحة
  const [setup, setSetup] = useState({
    projectType: "",
    villaCategory: "",
    contractType: "",
    internalCode: "",
  });

  // ✅ مزامنة الحالة مع بيانات المشروع عند التحميل/التحديث
  useEffect(() => {
    if (!project) return;
    setSetup({
      projectType: project.project_type || "",
      villaCategory: project.villa_category || "",
      contractType: project.contract_type || "",
      internalCode: project.internal_code || "",
    });
  }, [project]);

  const title = project?.display_name || project?.name || `${t("wizard_project_prefix")} #${projectId}`;

  return (
    <PageLayout
      loading={loading}
      error={error}
      loadingText={t("loading")}
      errorText={t("error_default")}
    >
      <div className="container">
        <ViewPageHeader
          title={`${t("project_information")} — ${title}`}
          projectId={projectId}
          showWizard={false}
          backLabel={t("back_projects")}
        />

        <div className="mt-12">
          <ProjectSetupStep
            value={setup}
            onChange={setSetup}
            onNext={null}
            onPrev={null}
            isView={true}
            onSaved={reload}
          />
        </div>

        {/* تم إزالة زر التعديل الإضافي هنا لتقليل اللخبطة
            التعديل يتم من داخل نفس الكارد (زر التعديل الأبيض في أعلى قسم الإعداد)
            أو من صفحة ProjectView عبر زر "تعديل المشروع" / "edit" */}
      </div>
    </PageLayout>
  );
}
