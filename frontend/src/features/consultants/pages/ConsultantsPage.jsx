import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../../services/api";
import PageLayout from "../../../components/layout/PageLayout";
import Button from "../../../components/common/Button";

export default function ConsultantsPage() {
  const { t, i18n } = useTranslation();
  const isAR = /^ar\b/i.test(i18n.language || "");
  const navigate = useNavigate();
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadConsultants();
  }, []);

  const loadConsultants = async () => {
    setLoading(true);
    try {
      const { data: projects } = await api.get("projects/");
      const items = Array.isArray(projects) ? projects : (projects?.results || projects?.items || projects?.data || []);
      
      const consultantsMap = new Map();

      await Promise.all(
        items.map(async (p) => {
          const projectId = p.id;
          try {
            const { data: lic } = await api.get(`projects/${projectId}/license/`);
            const firstL = Array.isArray(lic) ? lic[0] : null;
            
            // جلب بيانات الترسية
            let awardingData = null;
            try {
              const { data: award } = await api.get(`projects/${projectId}/awarding/`);
              if (Array.isArray(award) && award.length > 0) {
                awardingData = award[0];
              }
            } catch (e) {}

            if (firstL) {
              // استشاري التصميم
              if (firstL.design_consultant_name) {
                const key = firstL.design_consultant_name.toLowerCase().trim();
                if (!consultantsMap.has(key)) {
                  consultantsMap.set(key, {
                    name: firstL.design_consultant_name,
                    licenseNo: firstL.design_consultant_license_no || "",
                    type: "design",
                    projects: [],
                    fullData: {
                      design_consultant_name: firstL.design_consultant_name,
                      design_consultant_license_no: firstL.design_consultant_license_no,
                    },
                    awardingData: {},
                  });
                }
                const consultantData = consultantsMap.get(key);
                // إضافة بيانات الترسية إذا كانت موجودة
                if (awardingData?.consultant_registration_number) {
                  consultantData.awardingData = {
                    consultant_registration_number: awardingData.consultant_registration_number,
                  };
                }
                if (!consultantData.projects.find((pr) => pr.id === projectId)) {
                  consultantData.projects.push({
                    id: projectId,
                    name: p?.display_name || p?.name || `Project #${projectId}`,
                    internalCode: p?.internal_code,
                  });
                }
              }

              // استشاري الإشراف (إذا كان مختلف)
              if (firstL.supervision_consultant_name && 
                  firstL.supervision_consultant_name !== firstL.design_consultant_name) {
                const key = firstL.supervision_consultant_name.toLowerCase().trim();
                if (!consultantsMap.has(key)) {
                  consultantsMap.set(key, {
                    name: firstL.supervision_consultant_name,
                    licenseNo: firstL.supervision_consultant_license_no || "",
                    type: "supervision",
                    projects: [],
                    fullData: {
                      supervision_consultant_name: firstL.supervision_consultant_name,
                      supervision_consultant_license_no: firstL.supervision_consultant_license_no,
                    },
                    awardingData: {},
                  });
                }
                const consultantData = consultantsMap.get(key);
                // إضافة بيانات الترسية إذا كانت موجودة
                if (awardingData?.consultant_registration_number) {
                  consultantData.awardingData = {
                    consultant_registration_number: awardingData.consultant_registration_number,
                  };
                }
                if (!consultantData.projects.find((pr) => pr.id === projectId)) {
                  consultantData.projects.push({
                    id: projectId,
                    name: p?.display_name || p?.name || `Project #${projectId}`,
                    internalCode: p?.internal_code,
                  });
                }
              }
            }
          } catch (e) {}
        })
      );

      const consultantsList = Array.from(consultantsMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name, isAR ? "ar" : "en")
      );

      setConsultants(consultantsList);
    } catch (e) {
      console.error("Error loading consultants:", e);
      setConsultants([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredConsultants = consultants.filter((consultant) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      consultant.name.toLowerCase().includes(query) ||
      consultant.licenseNo?.toLowerCase().includes(query)
    );
  });

  const handleConsultantClick = (consultant) => {
    navigate(`/consultants/${encodeURIComponent(consultant.name)}`, { 
      state: { consultantData: consultant } 
    });
  };

  return (
    <PageLayout loading={loading} loadingText={t("loading")}>
      <div className="container">
        <div className="card">
          <div className="prj-header">
            <h1 className="prj-title">{t("consultants")}</h1>
            <p className="prj-subtitle">{t("consultants_page_subtitle")}</p>
          </div>

          <div className="mb-12">
            <input
              type="text"
              className="input"
              placeholder={t("search_consultants")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: "400px" }}
            />
          </div>

          {filteredConsultants.length === 0 ? (
            <div className="card text-center" style={{ padding: "40px" }}>
              <p className="prj-muted">
                {searchQuery ? t("no_consultants_match_search") : t("no_consultants_found")}
              </p>
            </div>
          ) : (
            <div className="prj-table__wrapper">
              <table className="prj-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t("consultant_name")}</th>
                    <th>{t("license_number")}</th>
                    <th>{t("type")}</th>
                    <th>{t("projects_count")}</th>
                    <th>{t("action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConsultants.map((consultant, idx) => (
                    <tr key={idx}>
                      <td className="prj-muted">{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{consultant.name}</div>
                      </td>
                      <td>
                        <code className="prj-code">{consultant.licenseNo || t("empty_value")}</code>
                      </td>
                      <td>
                        <span className="prj-badge is-on">
                          {consultant.type === "design" ? t("design_consultant") : t("supervision_consultant")}
                        </span>
                      </td>
                      <td>
                        <span className="prj-badge is-on">
                          {consultant.projects.length} {t("projects")}
                        </span>
                      </td>
                      <td className="prj-actions">
                        <Button
                          variant="primary"
                          onClick={() => handleConsultantClick(consultant)}
                          className="prj-btn prj-btn--primary"
                        >
                          {t("view_details")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} className="prj-foot prj-muted">
                      {t("total_consultants", { count: filteredConsultants.length, total: consultants.length })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

