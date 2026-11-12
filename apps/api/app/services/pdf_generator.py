"""PDF Generation Service for BuildSmart AI estimates.

Renders clean, professional A4 PDF reports for residential cost estimates
using ReportLab, including project specifications, P10/P50/P90 cost ranges,
9-category SSR breakdown, top cost drivers, and legal disclaimers.
Supports internationalization (i18n) for English (en), Hindi (hi), and Marathi (mr)
with TrueType Devanagari script fonts (Noto Sans Devanagari).
"""

import functools
import io
import logging
from pathlib import Path
from typing import Any, override

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    Flowable,
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.models.estimate import Estimate
from app.models.project import Project
from app.utils.i18n import (
    SUPPORTED_LANGUAGES,
    SupportedLanguage,
    t,
    translate_budget_status,
    translate_category,
    translate_category_desc,
    translate_construction_type,
    translate_quality_tier,
)

logger = logging.getLogger(__name__)

# Brand Palette
COLOR_PRIMARY_BRICK = colors.HexColor("#A83232")
COLOR_INK_DARK = colors.HexColor("#1C1917")
COLOR_INK_MUTED = colors.HexColor("#57534E")
COLOR_PAPER_LIGHT = colors.HexColor("#F9F8F6")
COLOR_BORDER = colors.HexColor("#E7E5E4")
COLOR_ACCENT_GREEN = colors.HexColor("#15803D")
COLOR_ACCENT_AMBER = colors.HexColor("#B45309")
COLOR_ACCENT_RED = colors.HexColor("#B91C1C")

@functools.lru_cache(maxsize=1)
def register_devanagari_fonts() -> bool:
    """Register TrueType fonts for Devanagari script rendering (Hindi and Marathi)."""
    candidate_dirs = [
        Path(__file__).resolve().parent.parent / "assets" / "fonts",
        Path(__file__).resolve().parent.parent.parent.parent / "assets" / "fonts",
        Path("apps/api/app/assets/fonts").resolve(),
    ]

    for font_dir in candidate_dirs:
        reg_path = font_dir / "NotoSansDevanagari-Regular.ttf"
        bold_path = font_dir / "NotoSansDevanagari-Bold.ttf"
        if reg_path.is_file() and bold_path.is_file():
            try:
                pdfmetrics.registerFont(TTFont("NotoSansDevanagari", str(reg_path)))
                pdfmetrics.registerFont(TTFont("NotoSansDevanagari-Bold", str(bold_path)))
                logger.info("Successfully registered Noto Sans Devanagari fonts from %s", font_dir)
                return True
            except Exception as exc:
                logger.warning("Failed to register Devanagari fonts from %s: %s", font_dir, exc)

    logger.warning("NotoSansDevanagari TTF files not found; falling back to default fonts.")
    return False


class NumberedCanvas(canvas.Canvas):  # type: ignore[misc]
    """Two-pass canvas to compute accurate total page count on running footers."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self.lang: SupportedLanguage = kwargs.pop("lang", "en")
        super().__init__(*args, **kwargs)
        self._saved_page_states: list[dict[str, Any]] = []

    @override
    def showPage(self) -> None:
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    @override
    def save(self) -> None:
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int) -> None:
        self.saveState()
        font_name = (
            "NotoSansDevanagari"
            if self.lang in ("hi", "mr") and register_devanagari_fonts()
            else "Helvetica"
        )
        self.setFont(font_name, 8)
        self.setFillColor(COLOR_INK_MUTED)

        # Footer divider and text
        self.setStrokeColor(COLOR_BORDER)
        self.setLineWidth(0.5)
        self.line(36, 32, A4[0] - 36, 32)

        footer_text = t("running_footer", self.lang)
        self.drawString(36, 22, footer_text)

        page_template = t("page_number", self.lang)
        page_str = page_template.format(page=self._pageNumber, total=page_count)
        self.drawRightString(A4[0] - 36, 22, page_str)
        self.restoreState()


def format_inr(val: int | float | None) -> str:
    """Format integer INR values using Indian numbering system (e.g. Rs. 25,00,000)."""
    if val is None:
        return "N/A"
    num = abs(int(round(val)))
    s = str(num)
    group_len = 3
    if len(s) <= group_len:
        formatted = s
    else:
        last3 = s[-3:]
        rest = s[:-3]
        parts: list[str] = []
        chunk_len = 2
        while len(rest) > chunk_len:
            parts.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            parts.insert(0, rest)
        parts.append(last3)
        formatted = ",".join(parts)
    prefix = "-" if val < 0 else ""
    return f"{prefix}Rs. {formatted}"


def _get_styles(lang: str = "en") -> dict[str, ParagraphStyle]:
    sample = getSampleStyleSheet()

    use_devanagari = lang in ("hi", "mr") and register_devanagari_fonts()
    base_font = "NotoSansDevanagari" if use_devanagari else "Helvetica"
    bold_font = "NotoSansDevanagari-Bold" if use_devanagari else "Helvetica-Bold"

    # Devanagari ascenders/descenders require slightly more generous leading
    leading_pad = 2 if use_devanagari else 0

    return {
        "HeaderBrand": ParagraphStyle(
            "HeaderBrand",
            parent=sample["Normal"],
            fontName=bold_font,
            fontSize=16,
            leading=18 + leading_pad,
            textColor=COLOR_PRIMARY_BRICK,
        ),
        "HeaderSub": ParagraphStyle(
            "HeaderSub",
            parent=sample["Normal"],
            fontName=base_font,
            fontSize=8,
            leading=11 + leading_pad,
            textColor=COLOR_INK_MUTED,
        ),
        "HeaderMeta": ParagraphStyle(
            "HeaderMeta",
            parent=sample["Normal"],
            fontName=bold_font,
            fontSize=8,
            leading=11 + leading_pad,
            alignment=2,  # Right-aligned
            textColor=COLOR_INK_DARK,
        ),
        "SectionHeading": ParagraphStyle(
            "SectionHeading",
            parent=sample["Normal"],
            fontName=bold_font,
            fontSize=10,
            leading=13 + leading_pad,
            textColor=COLOR_PRIMARY_BRICK,
            spaceAfter=4,
        ),
        "CardLabel": ParagraphStyle(
            "CardLabel",
            parent=sample["Normal"],
            fontName=base_font,
            fontSize=8,
            leading=10 + leading_pad,
            textColor=COLOR_INK_MUTED,
        ),
        "CardValue": ParagraphStyle(
            "CardValue",
            parent=sample["Normal"],
            fontName=bold_font,
            fontSize=8.5,
            leading=11 + leading_pad,
            textColor=COLOR_INK_DARK,
        ),
        "CostP50": ParagraphStyle(
            "CostP50",
            parent=sample["Normal"],
            fontName=bold_font,
            fontSize=17,
            leading=20 + leading_pad,
            alignment=1,  # Center
            textColor=COLOR_INK_DARK,
        ),
        "CostSub": ParagraphStyle(
            "CostSub",
            parent=sample["Normal"],
            fontName=base_font,
            fontSize=7.5,
            leading=10 + leading_pad,
            alignment=1,  # Center
            textColor=COLOR_INK_MUTED,
        ),
        "TableHeader": ParagraphStyle(
            "TableHeader",
            parent=sample["Normal"],
            fontName=bold_font,
            fontSize=8,
            leading=10 + leading_pad,
            textColor=colors.white,
        ),
        "TableCell": ParagraphStyle(
            "TableCell",
            parent=sample["Normal"],
            fontName=base_font,
            fontSize=7.5,
            leading=10 + leading_pad,
            textColor=COLOR_INK_DARK,
        ),
        "TableCellBold": ParagraphStyle(
            "TableCellBold",
            parent=sample["Normal"],
            fontName=bold_font,
            fontSize=7.5,
            leading=10 + leading_pad,
            textColor=COLOR_INK_DARK,
        ),
        "Disclaimer": ParagraphStyle(
            "Disclaimer",
            parent=sample["Normal"],
            fontName=base_font,
            fontSize=7,
            leading=9 + leading_pad,
            textColor=COLOR_INK_MUTED,
        ),
        "MockBadge": ParagraphStyle(
            "MockBadge",
            parent=sample["Normal"],
            fontName=bold_font,
            fontSize=8,
            leading=10 + leading_pad,
            alignment=1,
            textColor=COLOR_ACCENT_AMBER,
        ),
    }


def _build_header(
    estimate: Estimate,
    styles: dict[str, ParagraphStyle],
    content_width: float,
    lang: str = "en",
) -> list[Flowable]:
    elements: list[Flowable] = []
    date_str = (
        estimate.created_at.strftime("%d %b %Y").upper()
        if estimate.created_at
        else "PRELIMINARY"
    )
    est_short_id = f"BS-{str(estimate.id)[:8].upper()}"
    report_title = t("estimate_report", lang)
    date_label = t("date_label", lang)

    header_table_data = [
        [
            Paragraph(t("brand_title", lang), styles["HeaderBrand"]),
            Paragraph(
                f"{report_title} · {est_short_id}<br/>{date_label}: {date_str}",
                styles["HeaderMeta"],
            ),
        ],
        [
            Paragraph(
                t("header_sub", lang),
                styles["HeaderSub"],
            ),
            Paragraph(t("region_sub", lang), styles["HeaderSub"]),
        ],
    ]
    header_table = Table(header_table_data, colWidths=[content_width * 0.65, content_width * 0.35])
    header_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    elements.append(header_table)

    if estimate.is_mock:
        elements.append(Spacer(1, 4))
        mock_p = Paragraph(
            t("mock_banner", lang),
            styles["MockBadge"],
        )
        mock_table = Table([[mock_p]], colWidths=[content_width])
        mock_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),
                    ("BOX", (0, 0), (-1, -1), 1, COLOR_ACCENT_AMBER),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        elements.append(mock_table)

    elements.append(Spacer(1, 6))
    elements.append(
        HRFlowable(
            width="100%",
            thickness=1.5,
            color=COLOR_PRIMARY_BRICK,
            spaceBefore=2,
            spaceAfter=8,
        )
    )
    return elements


def _build_specs_table(
    project: Project,
    estimate: Estimate,
    styles: dict[str, ParagraphStyle],
    content_width: float,
    lang: str = "en",
) -> Table:
    inputs = estimate.inputs or {}
    built_up = inputs.get("built_up_area_sqft", 0)
    floors = inputs.get("floors", 1)
    bedrooms = inputs.get("bedrooms", 0)
    bathrooms = inputs.get("bathrooms", 0)
    zone_id = inputs.get("zone_id", "Pune")
    quality_tier = str(inputs.get("quality_tier", "standard"))
    construction_type = str(inputs.get("construction_type", "rcc_framed"))
    plot_area = inputs.get("plot_area_sqft")
    plot_str = f"{plot_area:,.0f} sq.ft" if plot_area else t("val_not_specified", lang)
    floor_suffix = t("val_floors_suffix", lang)

    specs_data = [
        [
            Paragraph(t("lbl_project_name", lang), styles["CardLabel"]),
            Paragraph(project.name, styles["CardValue"]),
            Paragraph(t("lbl_location_zone", lang), styles["CardLabel"]),
            Paragraph(zone_id, styles["CardValue"]),
        ],
        [
            Paragraph(t("lbl_built_up_area", lang), styles["CardLabel"]),
            Paragraph(f"{built_up:,.0f} sq.ft", styles["CardValue"]),
            Paragraph(t("lbl_configuration", lang), styles["CardLabel"]),
            Paragraph(f"{floors} {floor_suffix} · {bedrooms}B/{bathrooms}B", styles["CardValue"]),
        ],
        [
            Paragraph(t("lbl_quality_tier", lang), styles["CardLabel"]),
            Paragraph(translate_quality_tier(quality_tier, lang), styles["CardValue"]),
            Paragraph(t("lbl_structural_type", lang), styles["CardLabel"]),
            Paragraph(translate_construction_type(construction_type, lang), styles["CardValue"]),
        ],
        [
            Paragraph(t("lbl_plot_area", lang), styles["CardLabel"]),
            Paragraph(plot_str, styles["CardValue"]),
            Paragraph(t("lbl_estimation_basis", lang), styles["CardLabel"]),
            Paragraph(t("val_bottom_up_basis", lang), styles["CardValue"]),
        ],
    ]

    col_w = content_width / 4.0
    specs_table = Table(
        specs_data, colWidths=[col_w * 0.95, col_w * 1.05, col_w * 0.95, col_w * 1.05]
    )
    specs_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), COLOR_PAPER_LIGHT),
                ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return specs_table


def _build_cost_summary(
    estimate: Estimate,
    styles: dict[str, ParagraphStyle],
    content_width: float,
    lang: str = "en",
) -> list[Flowable]:
    elements: list[Flowable] = []
    cost_box_data = [
        [
            Paragraph(format_inr(estimate.total_p10), styles["CostP50"]),
            Paragraph(format_inr(estimate.total_p50), styles["CostP50"]),
            Paragraph(format_inr(estimate.total_p90), styles["CostP50"]),
        ],
        [
            Paragraph(t("cost_p10_sub", lang), styles["CostSub"]),
            Paragraph(t("cost_p50_sub", lang), styles["CostSub"]),
            Paragraph(t("cost_p90_sub", lang), styles["CostSub"]),
        ],
    ]
    cost_table = Table(cost_box_data, colWidths=[content_width / 3.0] * 3)
    cost_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), COLOR_PAPER_LIGHT),
                ("BACKGROUND", (1, 0), (1, -1), colors.HexColor("#F2EDE4")),
                ("BOX", (0, 0), (-1, -1), 1, COLOR_BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("TOPPADDING", (0, 0), (-1, 0), 6),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 6),
            ]
        )
    )
    elements.append(cost_table)

    if estimate.budget_inr:
        elements.append(Spacer(1, 4))
        raw_status = str(estimate.budget_status or "within").lower()
        status_label = translate_budget_status(raw_status, lang)
        status_color = (
            COLOR_ACCENT_GREEN
            if raw_status == "within"
            else COLOR_ACCENT_AMBER
            if raw_status == "tight"
            else COLOR_ACCENT_RED
        )
        budget_text = (
            f"<b>{t('lbl_target_budget', lang)}</b> {format_inr(estimate.budget_inr)} | "
            f"<b>{t('lbl_assessment', lang)}</b> "
            f"<font color='{status_color}'>{status_label}</font> | "
            f"<b>{t('lbl_confidence', lang)}</b> {estimate.confidence_label}"
        )
        budget_para = Paragraph(
            budget_text,
            ParagraphStyle(
                "BudgetNotice",
                parent=styles["CardValue"],
                fontSize=8,
                textColor=COLOR_INK_DARK,
            ),
        )
        elements.append(budget_para)

    return elements


def _build_boq_table(
    estimate: Estimate,
    styles: dict[str, ParagraphStyle],
    content_width: float,
    lang: str = "en",
) -> Table:
    breakdown_rows = [
        [
            Paragraph(t("col_category", lang), styles["TableHeader"]),
            Paragraph(t("col_estimated_cost", lang), styles["TableHeader"]),
            Paragraph(t("col_share_pct", lang), styles["TableHeader"]),
            Paragraph(t("col_scope_included", lang), styles["TableHeader"]),
        ]
    ]

    raw_breakdown = estimate.breakdown or []
    for item in raw_breakdown:
        raw_cat = str(item.get("category", ""))
        cat_name = translate_category(raw_cat, lang)
        amt = item.get("amount", 0)
        pct = item.get("share_pct", 0.0)
        desc = translate_category_desc(raw_cat, lang)

        breakdown_rows.append(
            [
                Paragraph(cat_name, styles["TableCellBold"]),
                Paragraph(format_inr(amt), styles["TableCell"]),
                Paragraph(f"{pct:.1f}%", styles["TableCell"]),
                Paragraph(desc, styles["TableCell"]),
            ]
        )

    # Total Row
    breakdown_rows.append(
        [
            Paragraph(t("total_p50_row", lang), styles["TableCellBold"]),
            Paragraph(format_inr(estimate.total_p50), styles["TableCellBold"]),
            Paragraph("100.0%", styles["TableCellBold"]),
            Paragraph(t("total_p50_scope", lang), styles["TableCellBold"]),
        ]
    )

    col_widths = [
        content_width * 0.24,
        content_width * 0.20,
        content_width * 0.12,
        content_width * 0.44,
    ]
    boq_table = Table(breakdown_rows, colWidths=col_widths)
    boq_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), COLOR_INK_DARK),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, COLOR_PAPER_LIGHT]),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#F0ECE4")),
                ("LINEBELOW", (0, 0), (-1, 0), 1, COLOR_PRIMARY_BRICK),
                ("LINEABOVE", (0, -1), (-1, -1), 1, COLOR_PRIMARY_BRICK),
                ("LINEBELOW", (0, -1), (-1, -1), 1, COLOR_PRIMARY_BRICK),
                ("GRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ]
        )
    )
    return boq_table


def _build_footer_notes(
    estimate: Estimate,
    styles: dict[str, ParagraphStyle],
    lang: str = "en",
) -> list[Flowable]:
    tail_elements: list[Flowable] = []
    if estimate.drivers:
        tail_elements.append(Paragraph(t("sec_cost_drivers", lang), styles["SectionHeading"]))
        drivers_items: list[str] = []
        for d in estimate.drivers:
            lbl = translate_category(str(d.get("label", "")), lang)
            pct = d.get("impact_pct", 0)
            drivers_items.append(f"<b>{lbl}:</b> {pct:.0f}%")
        drivers_text = " · ".join(drivers_items)
        tail_elements.append(Paragraph(drivers_text, styles["TableCell"]))
        tail_elements.append(Spacer(1, 6))

    tail_elements.append(
        HRFlowable(
            width="100%",
            thickness=0.5,
            color=COLOR_BORDER,
            spaceBefore=2,
            spaceAfter=4,
        )
    )
    disclaimer_text = f"<b>{t('disclaimer_title', lang)}</b> {t('disclaimer_body', lang)}"
    tail_elements.append(Paragraph(disclaimer_text, styles["Disclaimer"]))
    return tail_elements


def generate_estimate_pdf(
    project: Project,
    estimate: Estimate,
    lang: SupportedLanguage | str = "en",
) -> bytes:
    """Generate a high-quality A4 PDF report in requested language (en, hi, mr)."""
    valid_lang: SupportedLanguage = (
        lang if lang in SUPPORTED_LANGUAGES else "en"
    )

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=42,
    )

    styles = _get_styles(lang=valid_lang)
    story: list[Flowable] = []
    content_width = A4[0] - 72.0  # 523.27 pt

    # 1. Header
    story.extend(_build_header(estimate, styles, content_width, lang=valid_lang))

    # 2. Project Specifications
    story.append(Paragraph(t("sec_project_specs", valid_lang), styles["SectionHeading"]))
    story.append(_build_specs_table(project, estimate, styles, content_width, lang=valid_lang))
    story.append(Spacer(1, 8))

    # 3. Cost Summary
    story.append(Paragraph(t("sec_cost_summary", valid_lang), styles["SectionHeading"]))
    story.extend(_build_cost_summary(estimate, styles, content_width, lang=valid_lang))
    story.append(Spacer(1, 8))

    # 4. 9-Category BOQ Breakdown Table
    story.append(Paragraph(t("sec_boq_breakdown", valid_lang), styles["SectionHeading"]))
    story.append(_build_boq_table(estimate, styles, content_width, lang=valid_lang))
    story.append(Spacer(1, 8))

    # 5. Cost Drivers & Disclaimer
    story.append(KeepTogether(_build_footer_notes(estimate, styles, lang=valid_lang)))

    doc.build(story, canvasmaker=functools.partial(NumberedCanvas, lang=valid_lang))
    return buf.getvalue()
