import { useParams, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../../services/api";
import { useState, useEffect } from "react";
import PageLayout from "../../../components/layout/PageLayout";
import Button from "../../../components/common/Button";
import ViewRow from "../../../components/forms/ViewRow";
import { FaUpload, FaBuilding, FaEdit } from "react-icons/fa";

export default function ConsultantDetailPage() {
  const { consultantName } = useParams();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isAR = /^ar\b/i.test(i18n.language || "");
  const [consultantData, setConsultantData] = useState(location.state?.consultantData || null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    if (consultantData) {
      loadProjects();
      // تحميل صورة البروفايل من localStorage
      const savedImage = localStorage.getItem(`consultant_${consultantData.name}_image`);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } else {
      setError(t("consultant_data_not_found"));
      setLoading(false);
    }
  }, [consultantData]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result;
        setProfileImage(url);
        localStorage.setItem(`consultant_${consultantData.name}_image`, url);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadProjects = async () => {
    if (!consultantData) return;
    setLoading(true);
    try {
      const projectDetails = await Promise.all(
        consultantData.projects.map(async (p) => {
          try {
            const { data } = await api.get(`projects/${p.id}/`);
            return { ...p, ...data };
          } catch (e) {
            return p;
          }
        })
      );
      setProjects(projectDetails);
    } catch (e) {
      console.error("Error loading projects:", e);
      setError(t("error_loading_projects"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLayout loading={true} loadingText={t("loading")} />;
  }

  if (error || !consultantData) {
    return (
      <PageLayout>
        <div className="container">
          <div className="card">
            <h2>{t("error")}</h2>
            <p>{error || t("consultant_data_not_found")}</p>
            <Button as={Link} to="/consultants" variant="primary">
              {t("back_to_consultants")}
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const fullConsultantData = consultantData.fullData || {};

  return (
    <PageLayout>
      <div className="container">
        {/* بروفايل الشركة */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div style={{ 
            display: "flex", 
            gap: "32px", 
            alignItems: "flex-start",
            padding: "32px",
            flexWrap: "wrap"
          }}>
            {/* صورة البروفايل */}
            <div style={{ 
              position: "relative",
              flexShrink: 0
            }}>
              {profileImage ? (
                <div style={{ position: "relative" }}>
                  <img 
                    src={profileImage} 
                    alt={consultantData.name}
                    style={{
                      width: "160px",
                      height: "160px",
                      borderRadius: "12px",
                      objectFit: "cover",
                      border: "3px solid var(--border)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                  />
                  <label
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "8px",
                      background: "var(--primary)",
                      color: "white",
                      borderRadius: "50%",
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.1)";
                      e.currentTarget.style.background = "var(--primary-600)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.background = "var(--primary)";
                    }}
                  >
                    <FaEdit style={{ fontSize: "14px" }} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              ) : (
                <label
                  style={{
                    width: "160px",
                    height: "160px",
                    borderRadius: "12px",
                    border: "3px dashed var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    background: "var(--surface-2)",
                    transition: "all 0.2s ease",
                    gap: "12px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.background = "var(--primary-50)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--surface-2)";
                  }}
                >
                  <FaBuilding style={{ fontSize: "48px", color: "var(--muted)" }} />
                  <span style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 500 }}>
                    {t("upload_image")}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                </label>
              )}
            </div>

            {/* معلومات الشركة */}
            <div style={{ flex: 1, minWidth: "300px" }}>
              <Button as={Link} to="/consultants" variant="ghost" style={{ marginBottom: "16px" }}>
                ← {t("back_to_consultants")}
              </Button>
              <h1 style={{ 
                fontSize: "32px", 
                fontWeight: 700, 
                color: "var(--ink)",
                margin: "0 0 8px 0"
              }}>
                {consultantData.name}
              </h1>
              <p style={{ 
                fontSize: "16px", 
                color: "var(--muted)",
                margin: 0
              }}>
                {consultantData.type === "design" ? t("design_consultant") : t("supervision_consultant")}
              </p>
            </div>
            </div>
          </div>

          {/* بيانات الاستشاري */}
        <div className="card">
          <div className="card-body">
            <h2 style={{ marginBottom: "24px" }}>{t("consultant_details")}</h2>
            
              <div className="form-grid cols-2">
              <ViewRow 
                label={t("consultant_name")} 
                value={consultantData.name}
                tip={t("from_license")}
              />
                {consultantData.licenseNo && (
                <ViewRow 
                  label={t("license_number")} 
                  value={consultantData.licenseNo}
                  tip={t("from_license")}
                />
                )}
              <ViewRow 
                label={t("type")} 
                value={consultantData.type === "design" ? t("design_consultant") : t("supervision_consultant")}
                tip={t("from_license")}
              />
                {fullConsultantData.design_consultant_name && (
                <ViewRow 
                  label={t("design_consultant_name")} 
                  value={fullConsultantData.design_consultant_name}
                  tip={t("from_license")}
                />
                )}
                {fullConsultantData.design_consultant_license_no && (
                <ViewRow 
                  label={t("design_consultant_license_no")} 
                  value={fullConsultantData.design_consultant_license_no}
                  tip={t("from_license")}
                />
                )}
                {fullConsultantData.supervision_consultant_name && (
                <ViewRow 
                  label={t("supervision_consultant_name")} 
                  value={fullConsultantData.supervision_consultant_name}
                  tip={t("from_license")}
                />
                )}
                {fullConsultantData.supervision_consultant_license_no && (
                <ViewRow 
                  label={t("supervision_consultant_license_no")} 
                  value={fullConsultantData.supervision_consultant_license_no}
                  tip={t("from_license")}
                />
                )}
              {consultantData.awardingData?.consultant_registration_number && (
                <ViewRow 
                  label={t("consultant_registration_number")} 
                  value={consultantData.awardingData.consultant_registration_number}
                  tip={t("from_awarding")}
                />
              )}
            </div>
          </div>

          {/* المشاريع */}
          <div className="mt-16">
            <h2>{t("projects")} ({projects.length})</h2>
            {projects.length === 0 ? (
              <p className="prj-muted mt-16">{t("no_projects_found")}</p>
            ) : (
              <div className="prj-table__wrapper mt-16">
                <table className="prj-table">
                  <thead>
                    <tr>
                      <th>{t("project_name")}</th>
                      <th>{t("internal_code")}</th>
                      <th>{t("type")}</th>
                      <th>{t("action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name || p.display_name || `Project #${p.id}`}</td>
                        <td>
                          <code>{p.internal_code || `PRJ-${p.id}`}</code>
                        </td>
                        <td>{p.project_type || t("empty_value")}</td>
                        <td>
                          <Button as={Link} to={`/projects/${p.id}`} variant="primary" style={{ marginRight: "8px" }}>
                            {t("view")}
                          </Button>
                          <Button as={Link} to={`/projects/${p.id}/wizard`} variant="ghost">
                            {t("edit")}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

