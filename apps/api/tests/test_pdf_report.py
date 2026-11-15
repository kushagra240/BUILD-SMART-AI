"""Tests that the PDF report renders the saved estimate row it is given.

These run without a database: the ReportLab generator accepts the ORM objects
directly, so the assertions prove the PDF figures come from the estimate data
(not from a second hard-coded table).
"""

import io
import uuid

from app.models.estimate import Estimate
from app.models.project import Project
from app.services.pdf_generator import generate_estimate_pdf
from pypdf import PdfReader

BREAKDOWN = [
    {"category": "Foundation", "amount": 712500, "share_pct": 10.0},
    {"category": "Structure", "amount": 2137500, "share_pct": 30.0},
    {"category": "Masonry", "amount": 712500, "share_pct": 10.0},
    {"category": "Roofing", "amount": 427500, "share_pct": 6.0},
    {"category": "Flooring", "amount": 712500, "share_pct": 10.0},
    {"category": "Plumbing", "amount": 427500, "share_pct": 6.0},
    {"category": "Electrical", "amount": 498750, "share_pct": 7.0},
    {"category": "Finishing", "amount": 926250, "share_pct": 13.0},
    {"category": "Labour", "amount": 570000, "share_pct": 8.0},
]


def _saved_project_and_estimate() -> tuple[Project, Estimate]:
    project_id = uuid.uuid4()
    project = Project(id=project_id, user_id=uuid.uuid4(), name="Kothrud PDF Test Residence")
    estimate = Estimate(
        id=uuid.uuid4(),
        project_id=project_id,
        inputs={
            "built_up_area_sqft": 1500.0,
            "floors": 2,
            "bedrooms": 3,
            "bathrooms": 2,
            "zone_id": "ZN-PMC",
            "quality_tier": "standard",
            "construction_type": "rcc_framed",
            "plot_area_sqft": 2000.0,
            "budget_inr": 8000000,
        },
        total_p50=7125000,
        total_p10=6412500,
        total_p90=8193750,
        confidence_label="Medium",
        breakdown=BREAKDOWN,
        materials=[],
        drivers=[{"label": "Structure", "impact_pct": 30.0}],
        budget_inr=8000000,
        budget_status="within",
        gap_inr=875000,
        confidence_reason="Stored reason for the PDF test.",
        engine_version="test-engine-9.9",
        dataset_version="test-dataset-9.9",
        disclaimer="Stored disclaimer for the PDF test.",
        is_mock=False,
    )
    return project, estimate


def _extract_text(pdf_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def test_pdf_contains_the_saved_estimate_figures() -> None:
    project, estimate = _saved_project_and_estimate()

    pdf_bytes = generate_estimate_pdf(project=project, estimate=estimate, lang="en")

    assert pdf_bytes.startswith(b"%PDF")
    text = _extract_text(pdf_bytes)
    assert "Kothrud PDF Test Residence" in text
    assert "71,25,000" in text  # stored total_p50 in Indian grouping
    assert "64,12,500" in text  # stored total_p10
    assert "81,93,750" in text  # stored total_p90
    assert "Foundation" in text
    assert "Electrical" in text


def test_pdf_changes_when_the_saved_total_changes() -> None:
    project, estimate = _saved_project_and_estimate()
    estimate.total_p50 = 9125000

    text = _extract_text(generate_estimate_pdf(project=project, estimate=estimate, lang="en"))

    assert "91,25,000" in text
    assert "71,25,000" not in text
