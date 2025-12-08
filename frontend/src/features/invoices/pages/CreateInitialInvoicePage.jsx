import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../../services/api";
import PageLayout from "../../../components/layout/PageLayout";
import Button from "../../../components/common/Button";
import UnifiedSelect from "../../../components/common/Select";
import { formatMoney } from "../../../utils/formatters";
import "./CreateInvoicePage.css";

export default function CreateInitialInvoicePage() {
  const { invoiceId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isEditMode = !!invoiceId;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    project: "",
    amount: "0.00",
    stage: "",
    description: "",
    invoice_date: new Date().toISOString().split("T")[0],
    invoice_number: "",
    items: [{ description: "", quantity: 1, unit_price: 0, total: 0 }],
  });

  useEffect(() => {
    loadProjects();
    if (isEditMode) {
      loadInvoice();
    }
  }, [invoiceId, isEditMode]);

  const loadProjects = async () => {
    try {
      const { data } = await api.get("projects/");
      const items = Array.isArray(data) ? data : (data?.results || data?.items || data?.data || []);
      setProjects(items || []);
    } catch (e) {
      console.error("Error loading projects:", e);
    }
  };

  const loadInvoice = async () => {
    setLoading(true);
    try {
      // We need to find which project this invoice belongs to
      // First, try to get it from all projects
      const { data: projectsData } = await api.get("projects/");
      const projectsList = Array.isArray(projectsData) ? projectsData : (projectsData?.results || []);
      
      let invoice = null;
      let projectId = null;
      
      for (const project of projectsList) {
        try {
          const { data: invoices } = await api.get(`projects/${project.id}/initial-invoices/`);
          const items = Array.isArray(invoices) ? invoices : (invoices?.results || []);
          const found = items.find(inv => inv.id === parseInt(invoiceId));
          if (found) {
            invoice = found;
            projectId = project.id;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!invoice || !projectId) {
        alert(t("invoice_not_found") || "Invoice not found");
        navigate("/invoices");
        return;
      }

      const invoiceItems = Array.isArray(invoice.items) && invoice.items.length > 0 
        ? invoice.items 
        : [{ description: "", quantity: 1, unit_price: 0, total: 0 }];

      setFormData({
        project: projectId.toString(),
        amount: invoice.amount || "0.00",
        stage: invoice.stage || "",
        description: invoice.description || "",
        invoice_date: invoice.invoice_date ? invoice.invoice_date.split("T")[0] : "",
        invoice_number: invoice.invoice_number || "",
        items: invoiceItems,
      });
    } catch (e) {
      console.error("Error loading invoice:", e);
      alert(t("error_loading_invoice") || "Error loading invoice");
      navigate("/invoices");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalFromItems = (items) => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity || 0);
      const price = parseFloat(item.unit_price || 0);
      return sum + (qty * price);
    }, 0);
  };

  const updateInvoiceItem = (index, field, value) => {
    const newItems = [...(formData.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      const qty = parseFloat(field === 'quantity' ? value : newItems[index].quantity || 0);
      const price = parseFloat(field === 'unit_price' ? value : newItems[index].unit_price || 0);
      newItems[index].total = qty * price;
    }
    
    const totalAmount = calculateTotalFromItems(newItems);
    setFormData({ ...formData, items: newItems, amount: totalAmount.toFixed(2) });
  };

  const addInvoiceItem = () => {
    const newItem = { description: "", quantity: 1, unit_price: 0, total: 0 };
    setFormData({ ...formData, items: [...(formData.items || []), newItem] });
  };

  const removeInvoiceItem = (index) => {
    const newItems = (formData.items || []).filter((_, i) => i !== index);
    if (newItems.length === 0) newItems.push({ description: "", quantity: 1, unit_price: 0, total: 0 });
    const totalAmount = calculateTotalFromItems(newItems);
    setFormData({ ...formData, items: newItems, amount: totalAmount.toFixed(2) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.project || !formData.invoice_date) {
      alert(t("fill_required_fields") || "Please fill required fields");
      return;
    }

    const validItems = (formData.items || []).filter(item => 
      item.description && item.description.trim() && 
      parseFloat(item.quantity || 0) > 0 && 
      parseFloat(item.unit_price || 0) > 0
    );

    if (validItems.length === 0) {
      alert(t("add_at_least_one_item") || "Please add at least one valid item");
      return;
    }

    setSaving(true);
    try {
      const totalAmount = calculateTotalFromItems(validItems);
      const payload = {
        project: parseInt(formData.project),
        amount: totalAmount,
        stage: formData.stage,
        description: formData.description,
        invoice_date: formData.invoice_date,
        invoice_number: formData.invoice_number,
        items: validItems,
      };

      if (isEditMode) {
        await api.patch(`projects/${formData.project}/initial-invoices/${invoiceId}/`, payload);
      } else {
        await api.post(`projects/${formData.project}/initial-invoices/`, payload);
      }

      navigate("/invoices");
    } catch (e) {
      console.error("Error saving invoice:", e);
      alert(e?.response?.data?.detail || t("save_error") || "Error saving invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout loading={loading} loadingText={t("loading")}>
      <div className="create-invoice-page">
        <div className="create-invoice-header">
          <Button
            variant="ghost"
            onClick={() => navigate("/invoices")}
            style={{ marginBottom: "16px" }}
          >
            ← {t("back") || "Back"} {t("to_invoices") || "to Invoices"}
          </Button>
          <h1 className="create-invoice-title">
            {isEditMode ? (t("edit_initial_invoice") || "Edit Initial Invoice") : (t("add_initial_invoice") || "Add Initial Invoice")}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="create-invoice-form">
          {/* Project Selection */}
          <div className="invoice-form-card">
            <div className="invoice-form-card-header">
              {t("invoice_details") || "تفاصيل الفاتورة"}
            </div>
            <div className="invoice-form-card-body">
              <div className="form-field">
                <label className="form-label">
                  {t("project_name") || "اسم المشروع"} *
                </label>
                <UnifiedSelect
                  options={projects}
                  value={formData.project}
                  onChange={(projectId) => setFormData({ ...formData, project: projectId })}
                  placeholder={t("select_project") || "اختر المشروع"}
                  isDisabled={isEditMode}
                  getOptionLabel={(opt) => opt.display_name || opt.name || `Project #${opt.id}`}
                  getOptionValue={(opt) => opt.id?.toString()}
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">
                    {t("invoice_date") || "تاريخ الفاتورة"} *
                  </label>
                  <input
                    type="date"
                    className="prj-input"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">
                    {t("stage") || "المرحلة / الطلب"}
                  </label>
                  <input
                    type="text"
                    className="prj-input"
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    placeholder={t("stage_placeholder") || "أدخل معرف المرحلة أو الطلب"}
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">
                  {t("invoice_number") || "رقم الفاتورة"}
                </label>
                <input
                  type="text"
                  className="prj-input"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  placeholder={t("invoice_number_placeholder") || "سيتم توليده تلقائياً إذا تركت فارغاً"}
                />
                <small className="form-hint">
                  {t("invoice_number_placeholder") || "سيتم توليده تلقائياً إذا تركت فارغاً"}
                </small>
              </div>

              <div className="form-field">
                <label className="form-label">
                  {t("description") || "وصف الدفعة"}
                </label>
                <textarea
                  className="prj-input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t("description_placeholder") || "أدخل وصف الدفعة"}
                />
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="invoice-form-card">
            <div className="invoice-form-card-header">
              <span>{t("invoice_items") || "أصناف الفاتورة"} *</span>
              <Button 
                variant="secondary" 
                size="small" 
                onClick={addInvoiceItem}
                type="button"
              >
                + {t("add_item") || "إضافة صنف"}
              </Button>
            </div>
            <div className="invoice-form-card-body">
              {(formData.items || []).length === 0 ? (
                <div className="empty-items-state">
                  <p>{t("no_items_added") || "لم يتم إضافة أي أصناف بعد"}</p>
                  <Button 
                    variant="secondary" 
                    size="small" 
                    onClick={addInvoiceItem}
                    type="button"
                  >
                    {t("add_first_item") || "إضافة أول صنف"}
                  </Button>
                </div>
              ) : (
                <div className="invoice-items-table-wrapper">
                  <table className="invoice-items-table">
                    <thead>
                      <tr>
                        <th>{t("item_description") || "الوصف"}</th>
                        <th style={{ width: "120px" }}>{t("quantity") || "الكمية"}</th>
                        <th style={{ width: "150px" }}>{t("unit_price") || "سعر الوحدة"}</th>
                        <th style={{ width: "150px" }}>{t("total") || "الإجمالي"}</th>
                        <th style={{ width: "60px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.items || []).map((item, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              className="prj-input"
                              value={item.description || ""}
                              onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                              placeholder={t("item_description_placeholder") || "وصف الصنف..."}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="prj-input"
                              value={item.quantity || 0}
                              onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              style={{ textAlign: "center" }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="prj-input"
                              value={item.unit_price || 0}
                              onChange={(e) => updateInvoiceItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              style={{ textAlign: "right" }}
                            />
                          </td>
                          <td className="item-total">
                            {formatMoney(item.total || 0)}
                          </td>
                          <td>
                            {(formData.items || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeInvoiceItem(index)}
                                className="remove-item-btn"
                                title={t("remove_item") || "حذف"}
                              >
                                ×
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="total-label">
                          {t("total_amount") || "المبلغ الإجمالي"}:
                        </td>
                        <td className="total-amount">
                          {formatMoney(formData.amount || 0)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/invoices")}
              disabled={saving}
            >
              {t("cancel") || "إلغاء"}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
            >
              {saving ? (t("saving") || "جاري الحفظ...") : (t("save") || "حفظ")}
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}

