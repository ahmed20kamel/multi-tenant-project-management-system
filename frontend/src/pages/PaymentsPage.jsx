import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";
import PageLayout from "../components/PageLayout";
import Button from "../components/Button";
import Dialog from "../components/Dialog";
import { formatMoney } from "../utils/formatters";

export default function PaymentsPage() {
  const { t, i18n } = useTranslation();
  const isAR = /^ar\b/i.test(i18n.language || "");
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    date: "",
    description: "",
    project: "",
  });
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadPayments();
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data } = await api.get("projects/");
      const items = Array.isArray(data) ? data : (data?.results || data?.items || data?.data || []);
      setProjects(items || []);
    } catch (e) {
      console.error("Error loading projects:", e);
    }
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("payments/");
      const items = Array.isArray(data) ? data : (data?.results || data?.items || data?.data || []);
      setPayments(items || []);
    } catch (e) {
      console.error("Error loading payments:", e);
      // ✅ إذا كان الخطأ 500 أو جدول غير موجود، نستخدم قائمة فارغة
      setPayments([]);
      // ✅ عرض رسالة خطأ للمستخدم إذا لزم
      if (e?.response?.status === 500) {
        console.warn("Payments table may not exist yet. Please run migrations.");
      }
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
    setEditingPayment(null);
    setFormData({
      amount: "",
      date: "",
      description: "",
      project: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (payment) => {
    setEditingPayment(payment);
    setFormData({
      amount: payment.amount || "",
      date: payment.date ? formatDate(payment.date).split("/").reverse().join("-") : "",
      description: payment.description || "",
      project: payment.project || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.amount || !formData.date) {
      alert(t("fill_required_fields"));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description,
      };

      if (formData.project) {
        payload.project = parseInt(formData.project);
      }

      if (editingPayment) {
        await api.patch(`payments/${editingPayment.id}/`, payload);
      } else {
        await api.post("payments/", payload);
      }

      setDialogOpen(false);
      loadPayments();
    } catch (e) {
      console.error("Error saving payment:", e);
      alert(e?.response?.data?.detail || t("save_error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`payments/${deletingId}/`);
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      loadPayments();
    } catch (e) {
      console.error("Error deleting payment:", e);
      alert(e?.response?.data?.detail || t("delete_error"));
    }
  };

  const filteredPayments = payments.filter((payment) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (payment.project_name || "").toLowerCase().includes(query) ||
      (payment.description || "").toLowerCase().includes(query) ||
      (payment.amount || "").toString().includes(query)
    );
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  return (
    <PageLayout loading={loading} loadingText={t("loading")}>
      <div className="list-page">
        <div className="list-header">
          <div>
            <h1 className="list-title">{t("payments_title")}</h1>
            <p className="prj-subtitle">{t("payments_subtitle")}</p>
          </div>
          <div className="list-header__actions">
            <Button onClick={openAddDialog} variant="primary">
              {t("add_payment")}
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

        {filteredPayments.length === 0 ? (
          <div className="prj-alert">
            <div className="prj-alert__title">{t("no_payments")}</div>
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
                    <th>{t("payment_date")}</th>
                    <th>{t("description")}</th>
                    <th style={{ minWidth: "200px" }}>{t("action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment, i) => (
                    <tr key={payment.id}>
                      <td className="prj-muted">{i + 1}</td>
                      <td>
                        {payment.project ? (
                          <Link to={`/projects/${payment.project}`} className="prj-link">
                            {payment.project_name || t("empty_value")}
                          </Link>
                        ) : (
                          <span className="prj-muted">{t("no_project")}</span>
                        )}
                      </td>
                      <td className="prj-nowrap prj-info-value--money">
                        {formatMoney(payment.amount)}
                      </td>
                      <td className="prj-nowrap">{formatDate(payment.date)}</td>
                      <td>{payment.description || t("empty_value")}</td>
                      <td className="prj-actions">
                        <Button
                          variant="secondary"
                          onClick={() => openEditDialog(payment)}
                          className="prj-btn prj-btn--secondary"
                        >
                          {t("edit")}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => {
                            setDeletingId(payment.id);
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
                    <td colSpan={6} className="prj-foot prj-muted">
                      {t("total")}: {formatMoney(totalAmount)} ({filteredPayments.length} {t("payments_count")})
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {/* Add/Edit Dialog */}
        <Dialog
          open={dialogOpen}
          title={editingPayment ? t("edit_payment") : t("add_payment")}
          desc={
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: "400px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                  {t("amount")} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="prj-input"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder={t("amount_placeholder")}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                  {t("payment_date")} *
                </label>
                <input
                  type="date"
                  className="prj-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                  {t("project_name")} ({t("optional")})
                </label>
                <select
                  className="prj-select"
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                >
                  <option value="">{t("no_project")}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name || p.name || `Project #${p.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                  {t("description")}
                </label>
                <textarea
                  className="prj-input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t("description_placeholder")}
                />
              </div>
            </div>
          }
          confirmLabel={saving ? t("saving") : t("save")}
          cancelLabel={t("cancel")}
          onClose={() => !saving && setDialogOpen(false)}
          onConfirm={handleSave}
          busy={saving}
        />

        {/* Delete Confirm Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          title={t("confirm_delete")}
          desc={t("confirm_delete_payment")}
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
