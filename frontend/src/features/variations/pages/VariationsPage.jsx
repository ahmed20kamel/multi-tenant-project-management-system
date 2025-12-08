import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../../services/api";
import PageLayout from "../../../components/layout/PageLayout";
import Button from "../../../components/common/Button";
import Dialog from "../../../components/common/Dialog";
import { formatMoney } from "../../../utils/formatters";

export default function VariationsPage() {
  const { t, i18n } = useTranslation();
  const isAR = /^ar\b/i.test(i18n.language || "");
  const navigate = useNavigate();
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadVariations();
  }, []);


  const loadVariations = async () => {
    setLoading(true);
    try {
      // Load variations from all projects
      const { data: projectsData } = await api.get("projects/");
      const projectsList = Array.isArray(projectsData) ? projectsData : (projectsData?.results || projectsData?.items || projectsData?.data || []);
      
      const allVariations = [];
      for (const project of projectsList) {
        try {
          const { data: variationsData } = await api.get(`projects/${project.id}/variations/`);
          const variationsList = Array.isArray(variationsData) ? variationsData : (variationsData?.results || variationsData?.items || variationsData?.data || []);
          variationsList.forEach(v => {
            allVariations.push({ ...v, project_name: project.display_name || project.name || `Project #${project.id}` });
          });
        } catch (e) {
          // Project might not have variations
        }
      }
      
      setVariations(allVariations);
    } catch (e) {
      console.error("Error loading variations:", e);
      setVariations([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t("empty_value");
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t("empty_value");
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return isAR ? `${day}/${month}/${year}` : `${year}-${month}-${day}`;
    } catch {
      return t("empty_value");
    }
  };

  const openAddDialog = () => {
    navigate("/variations/create");
  };

  const openEditDialog = (variation) => {
    navigate(`/variations/${variation.id}/edit`);
  };


  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      // Find the variation to get project ID
      const variation = variations.find(v => v.id === deletingId);
      if (!variation || !variation.project) {
        alert(t("error") || "Error");
        return;
      }
      
      await api.delete(`projects/${variation.project}/variations/${deletingId}/`);
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      loadVariations();
    } catch (e) {
      console.error("Error deleting variation:", e);
      alert(e?.response?.data?.detail || t("delete_error"));
    }
  };

  const filteredVariations = variations.filter((variation) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (variation.project_name || "").toLowerCase().includes(query) ||
      (variation.description || "").toLowerCase().includes(query) ||
      (variation.approved_by || "").toLowerCase().includes(query) ||
      (variation.amount || "").toString().includes(query)
    );
  });

  const totalAmount = filteredVariations.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0);

  return (
    <PageLayout loading={loading} loadingText={t("loading")}>
      <div className="list-page">
        <div className="list-header">
          <div>
            <h1 className="list-title">{t("variations_title") || "Variations / Change Orders"}</h1>
            <p className="prj-subtitle">{t("variations_subtitle") || "Manage project variations and change orders"}</p>
          </div>
          <div className="list-header__actions">
            <Button onClick={openAddDialog} variant="primary">
              {t("add_variation") || "Add Variation"}
            </Button>
          </div>
        </div>

        <div className="prj-filters">
          <input
            className="prj-input"
            placeholder={t("general_search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredVariations.length === 0 ? (
          <div className="prj-alert">
            <div className="prj-alert__title">{t("no_variations") || "No variations found"}</div>
          </div>
        ) : (
          <>
            <div className="prj-table__wrapper">
              <table className="prj-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t("project_name")}</th>
                    <th>{t("amount")}</th>
                    <th>{t("approval_date") || "Approval Date"}</th>
                    <th>{t("approved_by") || "Approved By"}</th>
                    <th>{t("description")}</th>
                    <th style={{ minWidth: "200px" }}>{t("action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVariations.map((variation, i) => (
                    <tr key={variation.id}>
                      <td className="prj-muted">{i + 1}</td>
                      <td>
                        {variation.project ? (
                          <Link to={`/projects/${variation.project}`} className="prj-link">
                            {variation.project_name || t("empty_value")}
                          </Link>
                        ) : (
                          <span className="prj-muted">{t("no_project")}</span>
                        )}
                      </td>
                      <td className="prj-nowrap prj-info-value--money">
                        {formatMoney(variation.amount)}
                      </td>
                      <td className="prj-nowrap">{formatDate(variation.approval_date)}</td>
                      <td>{variation.approved_by || t("empty_value")}</td>
                      <td>{variation.description || t("empty_value")}</td>
                      <td className="prj-actions">
                        <Button
                          variant="secondary"
                          onClick={() => openEditDialog(variation)}
                          className="prj-btn prj-btn--secondary"
                        >
                          {t("edit")}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => {
                            setDeletingId(variation.id);
                            setDeleteConfirmOpen(true);
                          }}
                          className="prj-btn prj-btn--danger"
                        >
                          {t("delete")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={7} className="prj-foot prj-muted">
                      {t("total")}: {formatMoney(totalAmount)} ({filteredVariations.length} {t("variations_count") || "variations"})
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {/* Delete Confirm Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          title={t("confirm_delete")}
          desc={t("confirm_delete_variation") || "Are you sure you want to delete this variation?"}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDelete}
          danger
        />
      </div>
    </PageLayout>
  );
}

