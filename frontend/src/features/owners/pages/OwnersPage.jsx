import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../../services/api";
import PageLayout from "../../../components/layout/PageLayout";
import Button from "../../../components/common/Button";

export default function OwnersPage() {
  const { t, i18n } = useTranslation();
  const isAR = /^ar\b/i.test(i18n.language || "");
  const navigate = useNavigate();
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadOwners();
  }, []);

  const loadOwners = async () => {
    setLoading(true);
    try {
      const { data: projects } = await api.get("projects/");
      const items = Array.isArray(projects) ? projects : (projects?.results || projects?.items || projects?.data || []);
      
      const ownersMap = new Map();

      await Promise.all(
        items.map(async (p) => {
          const projectId = p.id;
          try {
            const { data: sp } = await api.get(`projects/${projectId}/siteplan/`);
            const first = Array.isArray(sp) ? sp[0] : null;
            // ✅ عرض فقط المالك الأول (الذي المشروع باسمه)
            if (first?.owners?.length) {
              const owner = first.owners[0]; // المالك الأول فقط
              // التأكد من وجود owner_name_ar و owner_name_en
              const ownerNameAr = owner?.owner_name_ar || owner?.owner_name || "";
              const ownerNameEn = owner?.owner_name_en || "";
              const ownerName = ownerNameAr || ownerNameEn;
              
              if (ownerName) {
                // ✅ استخدام id_number كـ key إضافي لتمييز الملاك المختلفين بنفس الاسم
                const idNumber = owner?.id_number || "";
                const key = `${ownerName.toLowerCase().trim()}_${idNumber}`;
                
                if (!ownersMap.has(key)) {
                  ownersMap.set(key, {
                    name: ownerName,
                    nameAr: ownerNameAr,
                    nameEn: ownerNameEn,
                    projects: [],
                    fullData: {
                      ...owner,
                      // ✅ التأكد من وجود جميع البيانات
                      id_number: owner?.id_number || "",
                      nationality: owner?.nationality || "",
                      phone: owner?.phone || "",
                      email: owner?.email || "",
                      id_issue_date: owner?.id_issue_date || "",
                      id_expiry_date: owner?.id_expiry_date || "",
                      id_attachment: owner?.id_attachment || "",
                      right_hold_type: owner?.right_hold_type || "",
                      share_possession: owner?.share_possession || "",
                      share_percent: owner?.share_percent || "",
                    },
                  });
                }
                const ownerData = ownersMap.get(key);
                if (!ownerData.projects.find((pr) => pr.id === projectId)) {
                  ownerData.projects.push({
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

      const ownersList = Array.from(ownersMap.values()).sort((a, b) => 
        (a.nameAr || a.name).localeCompare(b.nameAr || b.name, isAR ? "ar" : "en")
      );

      setOwners(ownersList);
    } catch (e) {
      console.error("Error loading owners:", e);
      setOwners([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOwners = owners.filter((owner) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      owner.name.toLowerCase().includes(query) ||
      owner.nameAr?.toLowerCase().includes(query) ||
      owner.nameEn?.toLowerCase().includes(query) ||
      owner.fullData?.nationality?.toLowerCase().includes(query) ||
      owner.fullData?.id_number?.toLowerCase().includes(query)
    );
  });

  const handleOwnerClick = (owner) => {
    navigate(`/owners/${encodeURIComponent(owner.name)}`, { 
      state: { ownerData: owner } 
    });
  };

  return (
    <PageLayout loading={loading} loadingText={t("loading")}>
      <div className="container">
        <div className="card">
          <div className="prj-header">
            <h1 className="prj-title">{t("owners")}</h1>
            <p className="prj-subtitle">{t("owners_page_subtitle")}</p>
          </div>

          <div className="mb-12">
            <input
              type="text"
              className="input"
              placeholder={t("search_owners")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: "400px" }}
            />
          </div>

          {filteredOwners.length === 0 ? (
            <div className="card text-center" style={{ padding: "40px" }}>
              <p className="prj-muted">
                {searchQuery ? t("no_owners_match_search") : t("no_owners_found")}
              </p>
            </div>
          ) : (
            <div className="prj-table__wrapper">
              <table className="prj-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t("owner_name")}</th>
                    <th>{t("nationality")}</th>
                    <th>{t("id_number")}</th>
                    <th>{t("projects_count")}</th>
                    <th>{t("action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOwners.map((owner, idx) => (
                    <tr key={idx}>
                      <td className="prj-muted">{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{owner.name}</div>
                        {owner.nameAr && owner.nameEn && (
                          <div className="prj-cell__sub prj-muted" style={{ fontSize: "12px" }}>
                            {owner.nameAr !== owner.name && owner.nameAr}
                          </div>
                        )}
                      </td>
                      <td>{owner.fullData?.nationality || t("empty_value")}</td>
                      <td>
                        <code className="prj-code">{owner.fullData?.id_number || t("empty_value")}</code>
                      </td>
                      <td>
                        <span className="prj-badge is-on">
                          {owner.projects.length} {t("projects")}
                        </span>
                      </td>
                      <td className="prj-actions">
                        <Button
                          variant="primary"
                          onClick={() => handleOwnerClick(owner)}
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
                      {t("total_owners", { count: filteredOwners.length, total: owners.length })}
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

