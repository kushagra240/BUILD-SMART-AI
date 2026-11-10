"""PDF Generation Service for BuildSmart AI estimates.

Renders clean, professional A4 PDF reports for residential cost estimates
using ReportLab, including project specifications, P10/P50/P90 cost ranges,
9-category SSR breakdown, top cost drivers, and legal disclaimers.
"""

import io
from typing import Any, override

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
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

# Brand Palette
COLOR_PRIMARY_BRICK = colors.HexColor("#A83232")
COLOR_INK_DARK = colors.HexColor("#1C1917")
COLOR_INK_MUTED = colors.HexColor("#57534E")
COLOR_PAPER_LIGHT = colors.HexColor("#F9F8F6")
COLOR_BORDER = colors.HexColor("#E7E5E4")
COLOR_ACCENT_GREEN = colors.HexColor("#15803D")
COLOR_ACCENT_AMBER = colors.HexColor("#B45309")
COLOR_ACCENT_RED = colors.HexColor("#B91C1C")

CATEGORY_DESCRIPTIONS: dict[str, str] = {
    "Foundation": "Excavation in hard/soft strata, PCC 1:4:8, rubble soling & backfilling",
    "Structure": "RCC M-20 framing (columns, beams, slabs) & Fe500D TMT reinforcement",
    "Masonry": "Burnt clay brickwork / AAC blocks in cement mortar 1:6",
    "Roofing": "Terrace waterproofing, thermal insulation & rain drainage slopes",
    "Flooring": "Vitrified living/bedroom tiles, anti-skid bathroom tiles & skirting",
    "Plumbing": "CPVC concealed piping, sanitary lines, drainage & inspection chambers",
    "Electrical": "Concealed conduits, copper wiring, modular switches & earthing pits",
    "Finishing": "Internal smooth cement plaster, external sand-face & exterior paint",
    "Labour": "Consolidated skilled & unskilled trade labour component (Decision D-02)",
}


class NumberedCanvas(canvas.Canvas):  # type: ignore[misc]
    """Two-pass canvas to compute accurate total page count on running footers."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
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
        self.setFont("Helvetica", 8)
        self.setFillColor(COLOR_INK_MUTED)

        # Footer divider and text
        self.setStrokeColor(COLOR_BORDER)
        self.setLineWidth(0.5)
        self.line(36, 32, A4[0] - 36, 32)

        self.drawString(
            36,
            22,
            "BuildSmart AI · Residential Construction Cost Estimation · Planning Document",
        )
        page_str = f"Page {self._pageNumber} of {page_count}"
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


def _get_styles() -> dict[str, ParagraphStyle]:
    sample = getSampleStyleSheet()

    return {
        "HeaderBrand": ParagraphStyle(
            "HeaderBrand",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=18,
            textColor=COLOR_PRIMARY_BRICK,
        ),
        "HeaderSub": ParagraphStyle(
            "HeaderSub",
            parent=sample["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=COLOR_INK_MUTED,
        ),
        "HeaderMeta": ParagraphStyle(
            "HeaderMeta",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            alignment=2,  # Right-aligned
            textColor=COLOR_INK_DARK,
        ),
        "SectionHeading": ParagraphStyle(
            "SectionHeading",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=13,
            textColor=COLOR_PRIMARY_BRICK,
            spaceAfter=4,
        ),
        "CardLabel": ParagraphStyle(
            "CardLabel",
            parent=sample["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=COLOR_INK_MUTED,
        ),
        "CardValue": ParagraphStyle(
            "CardValue",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=COLOR_INK_DARK,
        ),
        "CostP50": ParagraphStyle(
            "CostP50",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=20,
            alignment=1,  # Center
            textColor=COLOR_INK_DARK,
        ),
        "CostSub": ParagraphStyle(
            "CostSub",
            parent=sample["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            alignment=1,  # Center
            textColor=COLOR_INK_MUTED,
        ),
        "TableHeader": ParagraphStyle(
            "TableHeader",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.white,
        ),
        "TableCell": ParagraphStyle(
            "TableCell",
            parent=sample["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=COLOR_INK_DARK,
        ),
        "TableCellBold": ParagraphStyle(
            "TableCellBold",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=COLOR_INK_DARK,
        ),
        "Disclaimer": ParagraphStyle(
            "Disclaimer",
            parent=sample["Normal"],
            fontName="Helvetica",
            fontSize=7,
            leading=9,
            textColor=COLOR_INK_MUTED,
        ),
        "MockBadge": ParagraphStyle(
            "MockBadge",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            alignment=1,
            textColor=COLOR_ACCENT_AMBER,
        ),
    }


def _build_header(
    estimate: Estimate, styles: dict[str, ParagraphStyle], content_width: float
) -> list[Flowable]:
    elements: list[Flowable] = []
    date_str = (
        estimate.created_at.strftime("%d %b %Y").upper()
        if estimate.created_at
        else "PRELIMINARY"
    )
    est_short_id = f"BS-{str(estimate.id)[:8].upper()}"

    header_table_data = [
        [
            Paragraph("BuildSmart AI", styles["HeaderBrand"]),
            Paragraph(
                f"ESTIMATE REPORT · {est_short_id}<br/>DATE: {date_str}",
                styles["HeaderMeta"],
            ),
        ],
        [
            Paragraph(
                "Bottom-Up Construction Cost Estimation & Bill of Quantities",
                styles["HeaderSub"],
            ),
            Paragraph("Pune Region · PWD SSR 2022-23", styles["HeaderSub"]),
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
            "DEMO / PROTOTYPE ESTIMATE (Simulated planning data)",
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
) -> Table:
    inputs = estimate.inputs or {}
    built_up = inputs.get("built_up_area_sqft", 0)
    floors = inputs.get("floors", 1)
    bedrooms = inputs.get("bedrooms", 0)
    bathrooms = inputs.get("bathrooms", 0)
    zone_id = inputs.get("zone_id", "Pune")
    quality_tier = str(inputs.get("quality_tier", "standard")).title()
    construction_type = (
        str(inputs.get("construction_type", "rcc_framed")).replace("_", " ").title()
    )
    plot_area = inputs.get("plot_area_sqft")
    plot_str = f"{plot_area:,.0f} sq.ft" if plot_area else "Not specified"

    specs_data = [
        [
            Paragraph("Project Name:", styles["CardLabel"]),
            Paragraph(project.name, styles["CardValue"]),
            Paragraph("Location Zone:", styles["CardLabel"]),
            Paragraph(zone_id, styles["CardValue"]),
        ],
        [
            Paragraph("Total Built-Up Area:", styles["CardLabel"]),
            Paragraph(f"{built_up:,.0f} sq.ft", styles["CardValue"]),
            Paragraph("Configuration:", styles["CardLabel"]),
            Paragraph(f"{floors} Floor(s) · {bedrooms}B/{bathrooms}B", styles["CardValue"]),
        ],
        [
            Paragraph("Quality Tier:", styles["CardLabel"]),
            Paragraph(quality_tier, styles["CardValue"]),
            Paragraph("Structural Type:", styles["CardLabel"]),
            Paragraph(construction_type, styles["CardValue"]),
        ],
        [
            Paragraph("Plot Area:", styles["CardLabel"]),
            Paragraph(plot_str, styles["CardValue"]),
            Paragraph("Estimation Basis:", styles["CardLabel"]),
            Paragraph("Bottom-Up Civil Norms", styles["CardValue"]),
        ],
    ]

    col_w = content_width / 4.0
    specs_table = Table(specs_data, colWidths=[col_w * 0.9, col_w * 1.1, col_w * 0.9, col_w * 1.1])
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
    estimate: Estimate, styles: dict[str, ParagraphStyle], content_width: float
) -> list[Flowable]:
    elements: list[Flowable] = []
    cost_box_data = [
        [
            Paragraph(format_inr(estimate.total_p10), styles["CostP50"]),
            Paragraph(format_inr(estimate.total_p50), styles["CostP50"]),
            Paragraph(format_inr(estimate.total_p90), styles["CostP50"]),
        ],
        [
            Paragraph("P10 Low (-10% Baseline Range)", styles["CostSub"]),
            Paragraph("P50 Expected Median Total", styles["CostSub"]),
            Paragraph("P90 High (+15% Contingency)", styles["CostSub"]),
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
        b_status = str(estimate.budget_status or "within").lower()
        status_color = (
            COLOR_ACCENT_GREEN
            if b_status == "within"
            else COLOR_ACCENT_AMBER
            if b_status == "tight"
            else COLOR_ACCENT_RED
        )
        budget_text = (
            f"<b>Target Budget:</b> {format_inr(estimate.budget_inr)} | "
            f"<b>Assessment:</b> <font color='{status_color}'>{b_status.upper()}</font> | "
            f"<b>Confidence:</b> {estimate.confidence_label}"
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
    estimate: Estimate, styles: dict[str, ParagraphStyle], content_width: float
) -> Table:
    breakdown_rows = [
        [
            Paragraph("Category", styles["TableHeader"]),
            Paragraph("Estimated Cost", styles["TableHeader"]),
            Paragraph("Share (%)", styles["TableHeader"]),
            Paragraph("Primary Scope Included", styles["TableHeader"]),
        ]
    ]

    raw_breakdown = estimate.breakdown or []
    for item in raw_breakdown:
        cat_name = str(item.get("category", ""))
        amt = item.get("amount", 0)
        pct = item.get("share_pct", 0.0)
        desc = CATEGORY_DESCRIPTIONS.get(cat_name, "Standard residential specification")

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
            Paragraph("Total Estimated Cost (P50)", styles["TableCellBold"]),
            Paragraph(format_inr(estimate.total_p50), styles["TableCellBold"]),
            Paragraph("100.0%", styles["TableCellBold"]),
            Paragraph("Sum of all 9 preliminary work categories", styles["TableCellBold"]),
        ]
    )

    col_widths = [
        content_width * 0.22,
        content_width * 0.22,
        content_width * 0.14,
        content_width * 0.42,
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
    estimate: Estimate, styles: dict[str, ParagraphStyle]
) -> list[Flowable]:
    tail_elements: list[Flowable] = []
    if estimate.drivers:
        tail_elements.append(Paragraph("04 / KEY COST DRIVERS", styles["SectionHeading"]))
        drivers_text = " · ".join(
            f"<b>{d.get('label')}:</b> {d.get('impact_pct', 0):.0f}%" for d in estimate.drivers
        )
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
    disclaimer_text = (
        "<b>DATA PROVENANCE & LEGAL DISCLAIMER:</b> Rates sourced from Maharashtra Public Works "
        "Department (PWD) State Schedule of Rates (SSR) 2022-23 (Pune Region) and official Minimum "
        "Wage notifications. Quantities are derived from civil engineering heuristics. "
        "This preliminary estimate is generated for feasibility budgeting only. It does not "
        "constitute an architectural drawing, structural certification, or binding contractor "
        "quotation. Excludes land costs, stamp duty, PMRDA plan approvals, water/MSEB meters, "
        "and site-specific geotechnical conditions."
    )
    tail_elements.append(Paragraph(disclaimer_text, styles["Disclaimer"]))
    return tail_elements


def generate_estimate_pdf(project: Project, estimate: Estimate) -> bytes:
    """Generate a high-quality A4 PDF report from a saved estimate and project."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=42,
    )

    styles = _get_styles()
    story: list[Flowable] = []
    content_width = A4[0] - 72.0  # 523.27 pt

    # 1. Header
    story.extend(_build_header(estimate, styles, content_width))

    # 2. Project Specifications
    story.append(Paragraph("01 / PROJECT SPECIFICATIONS", styles["SectionHeading"]))
    story.append(_build_specs_table(project, estimate, styles, content_width))
    story.append(Spacer(1, 8))

    # 3. Cost Summary
    story.append(Paragraph("02 / COST ESTIMATE & RANGE SUMMARY", styles["SectionHeading"]))
    story.extend(_build_cost_summary(estimate, styles, content_width))
    story.append(Spacer(1, 8))

    # 4. 9-Category BOQ Breakdown Table
    story.append(
        Paragraph(
            "03 / 9-CATEGORY BOQ BREAKDOWN (MAHARASHTRA SSR 2022-23)",
            styles["SectionHeading"],
        )
    )
    story.append(_build_boq_table(estimate, styles, content_width))
    story.append(Spacer(1, 8))

    # 5. Cost Drivers & Disclaimer
    story.append(KeepTogether(_build_footer_notes(estimate, styles)))

    doc.build(story, canvasmaker=NumberedCanvas)
    return buf.getvalue()
