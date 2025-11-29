from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator

# ====== أساس timestamps ======
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ====== المشروع ======
class Project(TimeStampedModel):
    PROJECT_TYPE_CHOICES = [
        ('villa', 'Villa'),
        ('commercial', 'Commercial'),
        ('maintenance', 'Maintenance'),
        ('governmental', 'Governmental'),
        ('fitout', 'Fit-out / Renovation'),
    ]
    VILLA_CATEGORY_CHOICES = [
        ('residential', 'Residential Villa'),
        ('commercial', 'Commercial Villa'),
    ]
    CONTRACT_TYPE_CHOICES = [
        ('new', 'New Contract'),
        ('continue', 'Continuation Contract'),
    ]

    # ↓↓↓ السماح بإنشاء مشروع بدون اسم
    name = models.CharField(max_length=200, blank=True, default="")
    project_type = models.CharField(max_length=40, choices=PROJECT_TYPE_CHOICES, blank=True)
    villa_category = models.CharField(max_length=40, choices=VILLA_CATEGORY_CHOICES, blank=True)
    contract_type = models.CharField(max_length=40, choices=CONTRACT_TYPE_CHOICES, blank=True)

    status = models.CharField(
        max_length=30,
        choices=[
            ('not_started', 'Not Yet Started'),  # 0
            ('execution_started', 'Execution Started'),  # 1
            ('under_execution', 'Under Execution'),  # 2
            ('temporarily_suspended', 'Temporarily Suspended'),  # 3
            ('handover_stage', 'In Handover Stage'),  # 4
            ('pending_financial_closure', 'Pending Financial Closure'),  # 5
            ('completed', 'Completed'),  # 6
            # الحالات القديمة (للتوافق)
            ('draft', 'Draft'),
            ('in_progress', 'In Progress'),
        ],
        default='not_started',
    )

    # الكود الداخلي للمشروع — يبدأ بـ M ثم أرقام، مع شرط أن يكون آخر رقم فردياً
    internal_code = models.CharField(
        max_length=40,
        blank=True,
        db_index=True,
        validators=[RegexValidator(
            # M ثم أرقام، وآخر رقم فردي (يسمح بوجود أرقام زوجية في المنتصف)
            regex=r"^M[0-9]*[13579]$",
            message="Internal code must start with 'M' and end with an odd digit (1,3,5,7,9)."
        )],
        help_text="Starts with M, digits allowed, last digit must be odd (1,3,5,7,9).",
    )

    def __str__(self):
        return self.name or f"Project #{self.id}"

    def calculate_status_from_payments(self):
        """
        حساب حالة المشروع بناءً على الدفعات وفقاً للقواعد:
        0. لم يبدأ بعد: توقيع العقد فقط ولم تُسجل أي دفعة
        1. بدأ التنفيذ: عند تسجيل دفعة مقدمة فقط (Advance Payment)
        2. قيد التنفيذ: عند تسجيل الدفعة الأولى بعد الدفعة المقدمة
        3. متوقف مؤقتا: إذا مضى على آخر دفعة أكثر من 6 أشهر
        4. في مرحلة التسليم: إذا وصلت نسبة الإنجاز إلى 91% أو أكثر
        5. قيد الإغلاق المالي: إذا تبقى مبلغ أقل من 5% من إجمالي قيمة العقد
        6. تم الانتهاء: عند تنفيذ التسوية المالية النهائية واكتمال نسبة الإنجاز إلى 100%
        """
        from django.utils import timezone
        from datetime import timedelta
        from decimal import Decimal
        
        # الحصول على العقد
        contract = None
        total_contract_value = Decimal('0')
        try:
            # ✅ استخدام getattr لتجنب DoesNotExist exception
            if hasattr(self, '_contract_cache'):
                contract = self._contract_cache
            elif hasattr(self, 'contract'):
                try:
                    contract = self.contract
                    self._contract_cache = contract
                    total_contract_value = contract.total_project_value or Decimal('0')
                except Exception:
                    contract = None
        except Exception:
            pass
        
        # الحصول على جميع الدفعات مرتبة حسب التاريخ
        try:
            payments = self.payments.all().order_by('date', 'created_at')
            payments_count = payments.count()
        except Exception:
            # ✅ في حالة عدم وجود جدول الدفعات أو خطأ، نرجع الحالة الافتراضية
            return 'not_started'
        
        # 0. لم يبدأ بعد: توقيع العقد فقط ولم تُسجل أي دفعة
        if payments_count == 0:
            # إذا كان هناك عقد موقّع، الحالة "لم يبدأ بعد"
            if contract and contract.contract_date:
                return 'not_started'
            # إذا لم يكن هناك عقد، نرجع الحالة الافتراضية
            return 'not_started'
        
        # الحصول على آخر دفعة
        last_payment = payments.last()
        total_paid = sum(Decimal(str(p.amount)) for p in payments)
        
        # حساب نسبة الإنجاز
        completion_percentage = 0
        if total_contract_value > 0:
            completion_percentage = float((total_paid / total_contract_value) * 100)
        
        # 6. تم الانتهاء: 100% إنجاز
        if completion_percentage >= 100:
            return 'completed'
        
        # 4. في مرحلة التسليم: 91% أو أكثر (لكن أقل من 100%)
        if completion_percentage >= 91:
            return 'handover_stage'
        
        # 5. قيد الإغلاق المالي: تبقى أقل من 5% (لكن لم يصل 91% بعد)
        if total_contract_value > 0:
            remaining = total_contract_value - total_paid
            remaining_percentage = float((remaining / total_contract_value) * 100)
            if remaining_percentage < 5 and completion_percentage < 91:
                return 'pending_financial_closure'
        
        # 3. متوقف مؤقتا: آخر دفعة قبل أكثر من 6 أشهر (لكن لم يصل 91% بعد)
        if last_payment:
            six_months_ago = timezone.now().date() - timedelta(days=180)
            if last_payment.date < six_months_ago and completion_percentage < 91:
                return 'temporarily_suspended'
        
        # 1. بدأ التنفيذ: دفعة مقدمة فقط
        if payments_count == 1:
            # التحقق من أن الدفعة هي دفعة مقدمة (من الوصف)
            payment_desc = (last_payment.description or "").lower()
            if 'advance' in payment_desc or 'مقدمة' in payment_desc or 'مقدم' in payment_desc:
                return 'execution_started'
            # إذا لم تكن دفعة مقدمة صريحة، نعتبرها بداية التنفيذ
            return 'execution_started'
        
        # 2. قيد التنفيذ: أكثر من دفعة واحدة (ولم تصل للحالات الأخرى)
        if payments_count > 1:
            return 'under_execution'
        
        # افتراضي
        return 'not_started'

    def update_status_from_payments(self):
        """تحديث حالة المشروع بناءً على الدفعات"""
        try:
            new_status = self.calculate_status_from_payments()
            if self.status != new_status:
                # ✅ استخدام update لتجنب إطلاق signals مرة أخرى
                Project.objects.filter(pk=self.pk).update(status=new_status)
                # ✅ تحديث instance المحلي
                self.status = new_status
                return True
        except Exception as e:
            # ✅ في حالة أي خطأ، نكمل بدون تحديث الحالة
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error updating project status from payments: {e}", exc_info=True)
        return False

    # Properties للـ serializer
    @property
    def has_siteplan(self):
        """تحقق من وجود SitePlan للمشروع"""
        # ✅ التحقق من وجود related object
        if not hasattr(self, '_state') or self._state.adding or not self.pk:
            # ✅ إذا كان المشروع جديداً (لم يُحفظ بعد)، نرجع False
            return False
        # ✅ استخدام query مباشر لتجنب DoesNotExist exception
        return SitePlan.objects.filter(project_id=self.pk).exists()

    @property
    def has_license(self):
        """تحقق من وجود BuildingLicense للمشروع"""
        # ✅ التحقق من وجود related object
        if not hasattr(self, '_state') or self._state.adding or not self.pk:
            # ✅ إذا كان المشروع جديداً (لم يُحفظ بعد)، نرجع False
            return False
        # ✅ استخدام query مباشر لتجنب DoesNotExist exception
        return BuildingLicense.objects.filter(project_id=self.pk).exists()

    @property
    def completion(self):
        """نسبة إكمال المشروع بناءً على الخطوات المكتملة"""
        if not hasattr(self, '_state') or self._state.adding or not self.pk:
            return 0
        completed = 0
        if self.has_siteplan:
            completed += 1
        if self.has_license:
            completed += 1
        if Contract.objects.filter(project_id=self.pk).exists():
            completed += 1
        return int((completed / 3) * 100) if completed > 0 else 0


# ====== مخطط الأرض ======
class SitePlan(TimeStampedModel):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="siteplan")

    municipality = models.CharField(max_length=120, blank=True)
    zone = models.CharField(max_length=120, blank=True)
    sector = models.CharField(max_length=120, blank=True)
    road_name = models.CharField(max_length=120, blank=True)
    plot_area_sqm = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    plot_area_sqft = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    land_no = models.CharField(max_length=120, blank=True)
    plot_address = models.CharField(max_length=255, blank=True)
    construction_status = models.CharField(max_length=120, blank=True)
    allocation_type = models.CharField(max_length=120, blank=True)
    land_use = models.CharField(max_length=120, blank=True)
    base_district = models.CharField(max_length=120, blank=True)
    overlay_district = models.CharField(max_length=120, blank=True)
    allocation_date = models.DateField(null=True, blank=True)

    # Developer info (for investment)
    developer_name = models.CharField(max_length=200, blank=True)
    project_no = models.CharField(max_length=120, blank=True)
    project_name = models.CharField(max_length=200, blank=True)

    # مصدر المشروع
    source_of_project = models.TextField(blank=True, help_text="مصدر المشروع")

    # Notes
    notes = models.TextField(blank=True)

    # Application / transaction info
    application_number = models.CharField(max_length=120, blank=True)
    application_date = models.DateField(null=True, blank=True)
    application_file = models.FileField(upload_to="siteplans/applications/", null=True, blank=True)

    def __str__(self):
        return f"SitePlan #{self.id} for {self.project.name or self.project_id}"


class SitePlanOwner(TimeStampedModel):
    siteplan = models.ForeignKey(SitePlan, on_delete=models.CASCADE, related_name="owners")
    owner_name_ar = models.CharField(max_length=200, blank=True)
    owner_name_en = models.CharField(max_length=200, blank=True)
    nationality = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    id_number = models.CharField(max_length=50, blank=True)
    id_issue_date = models.DateField(null=True, blank=True)
    id_expiry_date = models.DateField(null=True, blank=True)
    id_attachment = models.FileField(upload_to="owners/ids/", null=True, blank=True)
    right_hold_type = models.CharField(max_length=120, blank=True, default="Ownership")
    share_possession = models.CharField(max_length=120, blank=True)
    share_percent = models.DecimalField(
        max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)], default=100
    )

    def __str__(self):
        return self.owner_name_ar or self.owner_name_en or "Unnamed Owner"


# ====== ترخيص البناء ======
class BuildingLicense(TimeStampedModel):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="license")

    # General license data
    license_type = models.CharField(max_length=120, blank=True)

    # (المطور) سنابشوت من الـ SitePlan
    project_no = models.CharField(max_length=120, blank=True)
    project_name = models.CharField(max_length=200, blank=True)

    # (الرخصة) الحقلان الجديدان
    license_project_no = models.CharField(max_length=120, blank=True)
    license_project_name = models.CharField(max_length=200, blank=True)

    license_no = models.CharField(max_length=120, blank=True)
    issue_date = models.DateField(null=True, blank=True)
    last_issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    technical_decision_ref = models.CharField(max_length=120, blank=True)
    technical_decision_date = models.DateField(null=True, blank=True)
    license_notes = models.TextField(blank=True)
    building_license_file = models.FileField(upload_to="licenses/", null=True, blank=True)

    # Plot / land data
    city = models.CharField(max_length=120, blank=True)
    zone = models.CharField(max_length=120, blank=True)
    sector = models.CharField(max_length=120, blank=True)
    plot_no = models.CharField(max_length=120, blank=True)
    plot_address = models.CharField(max_length=255, blank=True)
    plot_area_sqm = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    land_use = models.CharField(max_length=120, blank=True)
    land_use_sub = models.CharField(max_length=120, blank=True)
    land_plan_no = models.CharField(max_length=120, blank=True)

    # Parties
    # ===== استشاري التصميم / الإشراف =====
    consultant_same = models.BooleanField(default=True)

    # استشاري التصميم
    design_consultant_name = models.CharField(max_length=200, blank=True)
    design_consultant_name_en = models.CharField(max_length=200, blank=True)
    design_consultant_license_no = models.CharField(max_length=120, blank=True)

    # استشاري الإشراف
    supervision_consultant_name = models.CharField(max_length=200, blank=True)
    supervision_consultant_name_en = models.CharField(max_length=200, blank=True)
    supervision_consultant_license_no = models.CharField(max_length=120, blank=True)

    contractor_name = models.CharField(max_length=200, blank=True)
    contractor_name_en = models.CharField(max_length=200, blank=True)
    contractor_license_no = models.CharField(max_length=120, blank=True)
    contractor_phone = models.CharField(max_length=20, blank=True)
    contractor_email = models.EmailField(blank=True)

    # Owners snapshot داخل الرخصة
    owners = models.JSONField(default=list, blank=True)

    # Read-only snapshot من SitePlan
    siteplan_snapshot = models.JSONField(default=dict, editable=False)

    def __str__(self):
        return f"Building License {self.license_no or self.id}"


# ====== العقد ======
class Contract(TimeStampedModel):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="contract")

    contract_classification = models.CharField(max_length=120, blank=True)
    contract_type = models.CharField(max_length=120, blank=True)
    tender_no = models.CharField(max_length=120, blank=True)
    contract_date = models.DateField(null=True, blank=True)
    contractor_name = models.CharField(max_length=200, blank=True)
    contractor_name_en = models.CharField(max_length=200, blank=True)
    contractor_trade_license = models.CharField(max_length=120, blank=True)
    contractor_phone = models.CharField(max_length=20, blank=True)
    contractor_email = models.EmailField(blank=True)

    total_project_value = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    total_bank_value = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    total_owner_value = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    project_duration_months = models.PositiveIntegerField(default=0)

    start_order_date = models.DateField(null=True, blank=True)
    project_end_date = models.DateField(null=True, blank=True)

    # Owner consultant fees
    owner_includes_consultant = models.BooleanField(default=False)
    owner_fee_design_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    owner_fee_supervision_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    owner_fee_extra_mode = models.CharField(max_length=40, blank=True)
    owner_fee_extra_value = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)

    # Bank consultant fees
    bank_includes_consultant = models.BooleanField(default=False)
    bank_fee_design_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    bank_fee_supervision_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    bank_fee_extra_mode = models.CharField(max_length=40, blank=True)
    bank_fee_extra_value = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)

    # Snapshot
    license_snapshot = models.JSONField(default=dict, editable=False)
    
    # بيانات الملاك (قابلة للتحرير في العقد)
    owners = models.JSONField(
        default=list, 
        blank=True, 
        help_text="بيانات الملاك في العقد (قابلة للتحرير): [{'owner_name_ar': '...', 'owner_name_en': '...', 'phone': '...', 'email': '...', ...}, ...]"
    )
    
    # الملاحظات العامة
    general_notes = models.TextField(blank=True, help_text="ملاحظات عامة")

    # المرفقات الديناميكية
    attachments = models.JSONField(default=list, blank=True, help_text="مرفقات العقد الديناميكية")
    
    # التمديدات
    extensions = models.JSONField(
        default=list, 
        blank=True, 
        help_text="قائمة التمديدات: [{'reason': 'string', 'days': int, 'months': int}, ...]"
    )
    
    # الملفات القديمة (للتوافق مع البيانات الموجودة)
    contract_file = models.FileField(upload_to="contracts/main/", null=True, blank=True)
    contract_appendix_file = models.FileField(upload_to="contracts/appendix/", null=True, blank=True)
    contract_explanation_file = models.FileField(upload_to="contracts/explanations/", null=True, blank=True)
    start_order_file = models.FileField(upload_to="contracts/start_orders/", null=True, blank=True)

    def __str__(self):
        return f"Contract for {self.project.name or self.project_id}"



# ====== أمر الترسية ======
class Awarding(TimeStampedModel):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="awarding")

    # تاريخ أمر الترسية
    award_date = models.DateField(null=True, blank=True)
    
    # رقم تسجيل الاستشاري (VR-xxxx)
    consultant_registration_number = models.CharField(max_length=120, blank=True)
    
    # رقم المشروع
    project_number = models.CharField(max_length=120, blank=True)
    
    # رقم تسجيل المقاول (VR-xxxx)
    contractor_registration_number = models.CharField(max_length=120, blank=True)
    
    # ملف أمر الترسية
    awarding_file = models.FileField(upload_to="awarding/", null=True, blank=True)

    def __str__(self):
        return f"Awarding for {self.project.name or self.project_id}"


# ====== الدفعات ======
class Payment(TimeStampedModel):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="payments", null=True, blank=True)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'projects_payment'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'

    def __str__(self):
        if self.project:
            return f"Payment {self.amount} for {self.project.name or self.project_id} on {self.date}"
        return f"Payment {self.amount} on {self.date}"
