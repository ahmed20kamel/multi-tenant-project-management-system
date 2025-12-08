import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../../services/api";
import PageLayout from "../../../components/layout/PageLayout";
import Button from "../../../components/common/Button";
import Dialog from "../../../components/common/Dialog";
import UnifiedSelect from "../../../components/common/Select";
import { formatMoney, formatDate } from "../../../utils/formatters";
import "./InvoicesPage.css";

export default function InvoicesPage() {
  const { t, i18n } = useTranslation();
  const isAR = /^ar\b/i.test(i18n.language || "");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]); // Combined: Initial + Actual
  
  // حذف فردي
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetInvoice, setTargetInvoice] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  // تحديد متعدد + حذف جماعي
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Toast بسيط
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  
  
  // ===== فلاتر منظّمة =====
  const [filters, setFilters] = useState({
    q: "",
    project: "",
    invoice_type: "", // "initial" or "actual" or ""
    status: "", // "open" or "closed" or ""
    date_from: "",
    date_to: "",
  });

  useEffect(() => {
    loadAllData();
    return () => clearTimeout(toastTimer.current);
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      // Load projects
      const { data: projectsData } = await api.get("projects/");
      const projectsList = Array.isArray(projectsData) ? projectsData : (projectsData?.results || projectsData?.items || projectsData?.data || []);
      setProjects(projectsList || []);
      
      // Load all invoices from all projects
      const invoicesPromises = [];
      for (const project of projectsList) {
        invoicesPromises.push(
          api.get(`projects/${project.id}/initial-invoices/`).then(res => {
            const items = Array.isArray(res.data) ? res.data : (res.data?.results || res.data?.items || res.data?.data || []);
            return items.map(inv => ({ 
              ...inv, 
              __type: 'initial', 
              __project: project,
              items: Array.isArray(inv.items) ? inv.items : [] // ✅ Ensure items is always array
            }));
          }).catch(() => []),
          api.get(`projects/${project.id}/actual-invoices/`).then(res => {
            const items = Array.isArray(res.data) ? res.data : (res.data?.results || res.data?.items || res.data?.data || []);
            return items.map(inv => ({ 
              ...inv, 
              __type: 'actual', 
              __project: project,
              items: Array.isArray(inv.items) ? inv.items : [] // ✅ Ensure items is always array
            }));
          }).catch(() => [])
        );
      }
      
      const invoicesArrays = await Promise.all(invoicesPromises);
      const allInvoicesFlat = invoicesArrays.flat();
      setAllInvoices(allInvoicesFlat);
    } catch (e) {
      // Error loading data
      setProjects([]);
      setAllInvoices([]);
      showToast("error", t("loading_error") || "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    let filtered = [...allInvoices];
    
    if (filters.q) {
      const q = filters.q.toLowerCase();
      filtered = filtered.filter(inv => 
        (inv.invoice_number || '').toLowerCase().includes(q) ||
        (inv.description || '').toLowerCase().includes(q) ||
        (inv.__project?.display_name || inv.__project?.name || '').toLowerCase().includes(q)
      );
    }
    
    if (filters.project) {
      filtered = filtered.filter(inv => inv.project?.toString() === filters.project || inv.__project?.id?.toString() === filters.project);
    }
    
    if (filters.invoice_type) {
      filtered = filtered.filter(inv => inv.__type === filters.invoice_type);
    }
    
    if (filters.status) {
      if (filters.status === 'open') {
        filtered = filtered.filter(inv => {
          if (inv.__type === 'initial') {
            return (inv.remaining_balance || inv.amount || 0) > 0;
          }
          return true; // Actual invoices are always "paid"
        });
      } else if (filters.status === 'closed') {
        filtered = filtered.filter(inv => {
          if (inv.__type === 'initial') {
            return (inv.remaining_balance || 0) <= 0;
          }
          return false; // Actual invoices don't have "closed" status
        });
      }
    }
    
    if (filters.date_from) {
      filtered = filtered.filter(inv => {
        if (!inv.invoice_date) return false;
        return new Date(inv.invoice_date) >= new Date(filters.date_from);
      });
    }
    
    if (filters.date_to) {
      filtered = filtered.filter(inv => {
        if (!inv.invoice_date) return false;
        const invDate = new Date(inv.invoice_date);
        const toDate = new Date(filters.date_to);
        toDate.setHours(23, 59, 59, 999);
        return invDate <= toDate;
      });
    }
    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.invoice_date || a.created_at || 0);
      const dateB = new Date(b.invoice_date || b.created_at || 0);
      return dateB - dateA;
    });
  }, [allInvoices, filters]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ✅ Check if all filtered invoices are selected
  const isAllSelected = filteredInvoices.length > 0 && 
    filteredInvoices.every(inv => selectedIds.has(inv.id));
  
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      // If all are selected, deselect all
      if (isAllSelected) {
        const newSet = new Set(prev);
        filteredInvoices.forEach(inv => newSet.delete(inv.id));
        return newSet;
      }
      // Otherwise, select all filtered invoices
      const newSet = new Set(prev);
      filteredInvoices.forEach(inv => newSet.add(inv.id));
      return newSet;
    });
  };

  const askDelete = (inv) => {
    const title = inv.invoice_number || `Invoice #${inv.id}`;
    setTargetInvoice({ id: inv.id, name: title, type: inv.__type, project: inv.project || inv.__project?.id });
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!targetInvoice?.id) return;
    const { id, type, project } = targetInvoice;
    try {
      setDeletingId(id);
      if (type === 'initial') {
        await api.delete(`projects/${project}/initial-invoices/${id}/`);
      } else {
        await api.delete(`projects/${project}/actual-invoices/${id}/`);
      }
      setAllInvoices(prev => prev.filter(inv => inv.id !== id));
      setSelectedIds(prev => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      showToast("success", t("delete_success") || "Invoice deleted successfully");
      setConfirmOpen(false);
      setTargetInvoice(null);
    } catch (e) {
      // Delete failed
      showToast("error", t("delete_error") || "Error deleting invoice");
    } finally {
      setDeletingId(null);
    }
  };

  const askBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setBulkConfirmOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    let ok = 0, fail = 0;
    
    for (const id of ids) {
      try {
        const invoice = allInvoices.find(inv => inv.id === id);
        if (!invoice) {
          fail += 1;
          continue;
        }
        const projectId = invoice.project || invoice.__project?.id;
        if (invoice.__type === 'initial') {
          await api.delete(`projects/${projectId}/initial-invoices/${id}/`);
        } else {
          await api.delete(`projects/${projectId}/actual-invoices/${id}/`);
        }
        ok += 1;
      } catch (e) {
        // Bulk delete failed
        fail += 1;
      }
    }
    
    setAllInvoices(prev => prev.filter(inv => !selectedIds.has(inv.id)));
    setSelectedIds(new Set());
    setBulkDeleting(false);
    setBulkConfirmOpen(false);
    
    if (fail === 0) showToast("success", t("bulk_delete_success", { count: ok }) || `${ok} invoices deleted`);
    else if (ok === 0) showToast("error", t("bulk_delete_error") || "Error deleting invoices");
    else showToast("error", t("bulk_delete_partial", { ok, fail }) || `${ok} deleted, ${fail} failed`);
  };

  const selectedCount = selectedIds.size;

  const clearFilters = () =>
    setFilters({
      q: "",
      project: "",
      invoice_type: "",
      status: "",
      date_from: "",
      date_to: "",
    });

  const openAddInitialInvoiceDialog = () => {
    navigate("/invoices/initial/create");
  };

  const openEditInitialInvoiceDialog = (invoice) => {
    navigate(`/invoices/initial/${invoice.id}/edit`);
  };

  const openAddActualInvoiceDialog = () => {
    navigate("/invoices/actual/create");
  };


  const getInvoiceStatus = (invoice) => {
    if (invoice.__type === 'initial') {
      const remaining = invoice.remaining_balance || 0;
      if (remaining <= 0) {
        return { status: "closed", label: t("invoice_status_closed") || "Closed", color: "#10b981", bg: "#d1fae5" };
      }
      return { status: "open", label: t("invoice_status_open") || "Open", color: "#f59e0b", bg: "#fef3c7" };
    }
    return null;
  };

  const handlePrint = (invoice) => {
    navigate(`/invoices/${invoice.__type}/${invoice.id}/view`);
  };

  return (
    <PageLayout loading={loading} loadingText={t("loading")}>
      <div className="list-page">
        <div className="list-header">
          <div>
            <h1 className="list-title">{t("invoices_title") || "Invoices"}</h1>
            <p className="prj-subtitle">{t("invoices_subtitle") || "Manage Initial and Actual Invoices"}</p>
          </div>
          <div className="list-header__actions">
            <Button onClick={openAddInitialInvoiceDialog} variant="primary">
              {t("add_initial_invoice") || "Add Initial Invoice"}
            </Button>
            <Button onClick={openAddActualInvoiceDialog} variant="secondary" style={{ marginLeft: "8px" }}>
              {t("add_actual_invoice") || "Add Actual Invoice"}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="prj-filters">
          <div className="prj-filters__row">
            <input
              type="text"
              className="prj-input prj-input--search"
              placeholder={t("search_invoices") || "Search invoices..."}
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
            
            <UnifiedSelect
              options={projects}
              value={filters.project}
              onChange={(val) => setFilters({ ...filters, project: val })}
              placeholder={t("all_projects") || "All Projects"}
              getOptionLabel={(opt) => opt.display_name || opt.name || `Project #${opt.id}`}
              getOptionValue={(opt) => opt.id?.toString()}
              isClearable
            />
            
            <select
              className="prj-select"
              value={filters.invoice_type}
              onChange={(e) => setFilters({ ...filters, invoice_type: e.target.value })}
            >
              <option value="">{t("all_types") || "All Types"}</option>
              <option value="initial">{t("initial_invoice") || "Initial"}</option>
              <option value="actual">{t("actual_invoice") || "Actual"}</option>
            </select>
            
            <select
              className="prj-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">{t("all_statuses") || "All Statuses"}</option>
              <option value="open">{t("invoice_status_open") || "Open"}</option>
              <option value="closed">{t("invoice_status_closed") || "Closed"}</option>
            </select>
            
            <input
              type="date"
              className="prj-input"
              placeholder={t("date_from") || "From Date"}
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            />
            
            <input
              type="date"
              className="prj-input"
              placeholder={t("date_to") || "To Date"}
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            />
            
            <Button variant="ghost" onClick={clearFilters}>
              {t("clear_filters") || "Clear"}
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <div className="prj-bulk-actions">
            <span className="prj-bulk-actions__count">
              {selectedCount} {t("selected") || "selected"}
            </span>
            <Button variant="danger" onClick={askBulkDelete} disabled={bulkDeleting}>
              {t("delete_selected") || "Delete Selected"}
            </Button>
          </div>
        )}

        {/* Table */}
        {filteredInvoices.length === 0 ? (
          <div className="prj-alert">
            <div className="prj-alert__title">
              {t("no_invoices_match") || "No invoices match your filters"}
            </div>
          </div>
        ) : (
          <div className="prj-table__wrapper">
            <table className="prj-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }} className="text-center">
                    <input 
                      type="checkbox" 
                      aria-label={t("select_all")} 
                      checked={isAllSelected} 
                      onChange={toggleSelectAll} 
                    />
                  </th>
                  <th>#</th>
                  <th>{t("invoice_number") || "Invoice #"}</th>
                  <th>{t("project_name") || "Project"}</th>
                  <th>{t("invoice_type") || "Type"}</th>
                  <th className="text-right">{t("amount") || "Amount"}</th>
                  {filters.invoice_type !== 'actual' && (
                    <>
                      <th className="text-right">{t("paid_amount") || "Paid"}</th>
                      <th className="text-right">{t("remaining_balance") || "Remaining"}</th>
                    </>
                  )}
                  <th>{t("invoice_date") || "Date"}</th>
                  <th>{t("status") || "Status"}</th>
                  <th style={{ minWidth: "200px" }}>{t("actions") || "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice, i) => {
                  const checked = selectedIds.has(invoice.id);
                  const status = getInvoiceStatus(invoice);
                  const paidAmount = invoice.__type === 'initial' 
                    ? (parseFloat(invoice.amount) - parseFloat(invoice.remaining_balance || invoice.amount))
                    : null;

                  return (
                    <tr key={`${invoice.__type}-${invoice.id}`}>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(invoice.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td>{i + 1}</td>
                      <td>
                        <strong>{invoice.invoice_number || `#${invoice.id}`}</strong>
                      </td>
                      <td>
                        {invoice.__project?.display_name || invoice.__project?.name || `Project #${invoice.project || invoice.__project?.id}`}
                      </td>
                      <td>
                        <span className={`invoice-type-badge invoice-type-badge--${invoice.__type}`}>
                          {invoice.__type === 'initial' ? t("initial_invoice") : t("actual_invoice")}
                        </span>
                      </td>
                      <td className="text-right">
                        <strong>{formatMoney(invoice.amount)}</strong>
                      </td>
                      {filters.invoice_type !== 'actual' && (
                        <>
                          <td className="text-right">
                            {invoice.__type === 'initial' ? formatMoney(paidAmount) : '—'}
                          </td>
                          <td className="text-right">
                            {invoice.__type === 'initial' ? (
                              <strong style={{ color: status?.color }}>{formatMoney(invoice.remaining_balance || 0)}</strong>
                            ) : '—'}
                          </td>
                        </>
                      )}
                      <td>{formatDate(invoice.invoice_date)}</td>
                      <td>
                        {status && (
                          <span
                            className="invoice-status-badge"
                            style={{
                              backgroundColor: status.bg,
                              color: status.color,
                            }}
                          >
                            {status.label}
                          </span>
                        )}
                      </td>
                      <td className="prj-actions">
                        <Button
                          variant="primary"
                          onClick={() => handlePrint(invoice)}
                          className="prj-btn prj-btn--primary"
                        >
                          {t("print") || "Print"}
                        </Button>
                        {invoice.__type === 'initial' ? (
                          <Button
                            variant="secondary"
                            onClick={() => openEditInitialInvoiceDialog(invoice)}
                            className="prj-btn prj-btn--secondary"
                          >
                            {t("edit")}
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            onClick={() => navigate(`/invoices/actual/${invoice.id}/edit`)}
                            className="prj-btn prj-btn--secondary"
                          >
                            {t("edit")}
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          onClick={() => askDelete(invoice)}
                          disabled={deletingId === invoice.id}
                          className="prj-btn prj-btn--danger"
                        >
                          {t("delete")}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={filters.invoice_type !== 'actual' ? 11 : 9} className="prj-foot prj-muted">
                    {t("matching_total", { count: filteredInvoices.length, total: allInvoices.length }) || 
                     `${filteredInvoices.length} of ${allInvoices.length} invoices`}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={`toast ${toast.type === "success" ? "toast--ok" : "toast--err"}`} role="status" aria-live="polite">
            {toast.msg}
          </div>
        )}

        {/* Delete Confirm Dialog */}
        <Dialog
          open={confirmOpen}
          title={t("confirm_delete")}
          desc={
            <>
              {t("confirm_delete_invoice") || "Are you sure you want to delete"} {" "}
              <strong style={{marginInline: 6}}>{targetInvoice?.name}</strong>?<br/>
              {t("delete_cannot_undo") || "This action cannot be undone"}
            </>
          }
          confirmLabel={deletingId ? t("deleting") : t("delete")}
          cancelLabel={t("cancel")}
          onClose={() => !deletingId && setConfirmOpen(false)}
          onConfirm={handleDelete}
          danger
          busy={!!deletingId}
        />

        {/* Bulk Delete Confirm Dialog */}
        <Dialog
          open={bulkConfirmOpen}
          title={t("bulk_delete") || "حذف جماعي"}
          desc={
            <>
              {t("bulk_delete_invoices_desc") || "سيتم حذف"} {" "}
              <strong>{selectedCount}</strong>{" "}
              {selectedCount === 1 
                ? (t("invoice") || "فاتورة")
                : (t("invoices") || "فاتورة/فواتير")
              }{" "}
              {t("permanently") || "نهائياً"}?<br/>
              {t("bulk_delete_continue") || "هذا الإجراء لا يمكن التراجع عنه"}
            </>
          }
          confirmLabel={bulkDeleting ? t("deleting") : t("delete_selected")}
          cancelLabel={t("cancel")}
          onClose={() => !bulkDeleting && setBulkConfirmOpen(false)}
          onConfirm={handleBulkDelete}
          danger
          busy={bulkDeleting}
        />
      </div>
    </PageLayout>
  );
}
