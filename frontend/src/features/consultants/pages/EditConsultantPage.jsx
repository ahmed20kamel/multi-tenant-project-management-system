import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../../services/api";
import PageLayout from "../../../components/layout/PageLayout";
import Button from "../../../components/common/Button";
import Field from "../../../components/forms/Field";

export default function EditConsultantPage() {
  const { consultantName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAR = /^ar\b/i.test(i18n.language || "");
  
  const [consultantData, setConsultantData] = useState(location.state?.consultantData || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    name_en: "",
    license_no: "",
  });

  useEffect(() => {
    if (consultantData) {
      setForm({
        name: consultantData.name || "",
        name_en: consultantData.fullData?.design_consultant_name_en || consultantData.fullData?.supervision_consultant_name_en || "",
        license_no: consultantData.licenseNo || "",
      });
    } else {
      navigate("/consultants");
    }
  }, [consultantData, navigate]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    if (!consultantData || !form.name.trim()) {
      setError(t("consultant_name_required") || "Consultant name is required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const projectsToUpdate = consultantData.projects || [];
      let updatedCount = 0;
      let failedCount = 0;

      // تحديث جميع المشاريع المرتبطة
      for (const project of projectsToUpdate) {
        try {
          // جلب بيانات الرخصة الحالية
          const { data: licenses } = await api.get(`projects/${project.id}/license/`);
          const license = Array.isArray(licenses) ? licenses[0] : licenses;

          if (license) {
            const updatePayload = {};

            // تحديث بيانات استشاري التصميم
            if (consultantData.type === "design" && license.design_consultant_name === consultantData.name) {
              updatePayload.design_consultant_name = form.name;
              if (form.name_en) updatePayload.design_consultant_name_en = form.name_en;
              if (form.license_no) updatePayload.design_consultant_license_no = form.license_no;
            }

            // تحديث بيانات استشاري الإشراف
            if (consultantData.type === "supervision" && license.supervision_consultant_name === consultantData.name) {
              updatePayload.supervision_consultant_name = form.name;
              if (form.name_en) updatePayload.supervision_consultant_name_en = form.name_en;
              if (form.license_no) updatePayload.supervision_consultant_license_no = form.license_no;
            }

            // إذا كان الاستشاري نفسه للتصميم والإشراف
            if (license.consultant_same && license.design_consultant_name === consultantData.name) {
              updatePayload.design_consultant_name = form.name;
              if (form.name_en) updatePayload.design_consultant_name_en = form.name_en;
              if (form.license_no) updatePayload.design_consultant_license_no = form.license_no;
              updatePayload.supervision_consultant_name = form.name;
              if (form.name_en) updatePayload.supervision_consultant_name_en = form.name_en;
              if (form.license_no) updatePayload.supervision_consultant_license_no = form.license_no;
            }

            if (Object.keys(updatePayload).length > 0) {
              await api.patch(`projects/${project.id}/license/${license.id}/`, updatePayload);
              updatedCount++;
            }
          }
        } catch (e) {
          console.error(`Error updating project ${project.id}:`, e);
          failedCount++;
        }
      }

      if (updatedCount > 0) {
        setSuccess(
          t("consultant_updated_success")?.replace("{{count}}", updatedCount) ||
          `Consultant updated in ${updatedCount} project(s)`
        );
        
        // إعادة تحميل القائمة بعد ثانية
        setTimeout(() => {
          navigate("/consultants");
        }, 1500);
      } else if (failedCount > 0) {
        setError(t("update_failed") || "Failed to update consultant");
      }
    } catch (e) {
      console.error("Error updating consultant:", e);
      setError(t("update_error") || "Error updating consultant");
    } finally {
      setSaving(false);
    }
  };

  if (!consultantData) {
    return (
      <PageLayout>
        <div className="container">
          <div className="card">
            <p>{t("consultant_data_not_found")}</p>
            <Button onClick={() => navigate("/consultants")} variant="primary">
              {t("back_to_consultants")}
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container">
        <div className="card">
          <div className="prj-header">
            <h1 className="prj-title">{t("edit_consultant") || "Edit Consultant"}</h1>
            <p className="prj-subtitle">
              {t("edit_consultant_subtitle") || "Update consultant information across all projects"}
            </p>
          </div>

          {error && (
            <div className="alert alert--error" style={{ marginBottom: "16px" }}>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert--success" style={{ marginBottom: "16px" }}>
              {success}
            </div>
          )}

          <div className="form-grid cols-2" style={{ marginTop: "24px" }}>
            <Field
              label={t("consultant_name")}
              required
            >
              <input
                className="input"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={saving}
              />
            </Field>

            <Field
              label={t("consultant_name_en") || "Consultant Name (English)"}
            >
              <input
                className="input"
                value={form.name_en}
                onChange={(e) => handleChange("name_en", e.target.value)}
                disabled={saving}
              />
            </Field>

            <Field
              label={t("license_number")}
            >
              <input
                className="input"
                value={form.license_no}
                onChange={(e) => handleChange("license_no", e.target.value)}
                disabled={saving}
              />
            </Field>

            <div>
              <label className="form-label">{t("type")}</label>
              <div className="prj-badge is-on" style={{ marginTop: "8px" }}>
                {consultantData.type === "design" ? t("design_consultant") : t("supervision_consultant")}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "24px", padding: "16px", background: "var(--surface-2)", borderRadius: "8px" }}>
            <p className="prj-muted">
              {t("affects_projects_count")?.replace("{{count}}", consultantData.projects?.length || 0) ||
               `This will update ${consultantData.projects?.length || 0} project(s)`}
            </p>
          </div>

          <div style={{ marginTop: "32px", display: "flex", gap: "12px" }}>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
            >
              {saving ? t("saving") : t("save")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/consultants")}
              disabled={saving}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

