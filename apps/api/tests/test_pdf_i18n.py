"""Unit tests for internationalization (i18n) and multilingual PDF generation.

Verifies translation mappings for English (en), Hindi (hi), and Marathi (mr),
TrueType Devanagari font registration, and PDF generation across all supported locales.
"""

import uuid
from datetime import UTC, datetime

from app.models.estimate import Estimate
from app.models.project import Project
from app.services.pdf_generator import generate_estimate_pdf, register_devanagari_fonts
from app.utils.i18n import (
    BUDGET_STATUS_I18N,
    CATEGORIES_I18N,
    CATEGORY_DESCRIPTIONS_I18N,
    CONSTRUCTION_TYPES_I18N,
    QUALITY_TIERS_I18N,
    SUPPORTED_LANGUAGES,
    TRANSLATIONS,
    t,
    translate_budget_status,
    translate_category,
    translate_category_desc,
    translate_construction_type,
    translate_quality_tier,
)
from reportlab.pdfbase import pdfmetrics


def _make_dummy_project_and_estimate() -> tuple[Project, Estimate]:
    proj_id = uuid.uuid4()
    est_id = uuid.uuid4()

    project = Project(
        id=proj_id,
        user_id=uuid.uuid4(),
        name="Kothrud Residency",
    )

    estimate = Estimate(
        id=est_id,
        project_id=proj_id,
        inputs={
            "built_up_area_sqft": 1800.0,
            "floors": 2,
            "bedrooms": 3,
            "bathrooms": 2,
            "zone_id": "ZN-PMC",
            "quality_tier": "standard",
            "construction_type": "rcc_framed",
            "plot_area_sqft": 2400.0,
            "budget_inr": 3500000,
        },
        total_p50=2500000,
        total_p10=2250000,
        total_p90=2875000,
        confidence_label="Medium",
        breakdown=[
            {"category": "Foundation", "amount": 250000, "share_pct": 10.0},
            {"category": "Structure", "amount": 750000, "share_pct": 30.0},
            {"category": "Masonry", "amount": 250000, "share_pct": 10.0},
            {"category": "Roofing", "amount": 150000, "share_pct": 6.0},
            {"category": "Flooring", "amount": 200000, "share_pct": 8.0},
            {"category": "Plumbing", "amount": 150000, "share_pct": 6.0},
            {"category": "Electrical", "amount": 175000, "share_pct": 7.0},
            {"category": "Finishing", "amount": 325000, "share_pct": 13.0},
            {"category": "Labour", "amount": 250000, "share_pct": 10.0},
        ],
        materials=[],
        drivers=[
            {"label": "Structure", "impact_pct": 30.0},
            {"label": "Finishing", "impact_pct": 13.0},
        ],
        budget_inr=3500000,
        budget_status="within",
        is_mock=False,
        created_at=datetime.now(UTC),
    )
    return project, estimate


def test_i18n_translation_keys_completeness() -> None:
    """Verifies all translation tables provide non-empty values for en, hi, and mr."""
    for key, lang_map in TRANSLATIONS.items():
        for lang in SUPPORTED_LANGUAGES:
            assert lang in lang_map, f"Missing language '{lang}' for key '{key}'"
            assert len(lang_map[lang].strip()) > 0

    for cat, lang_map in CATEGORIES_I18N.items():
        for lang in SUPPORTED_LANGUAGES:
            assert lang in lang_map, f"Missing category translation '{lang}' for '{cat}'"
            assert len(lang_map[lang].strip()) > 0

    for cat, lang_map in CATEGORY_DESCRIPTIONS_I18N.items():
        for lang in SUPPORTED_LANGUAGES:
            assert lang in lang_map, f"Missing description translation '{lang}' for '{cat}'"
            assert len(lang_map[lang].strip()) > 0

    for tier, lang_map in QUALITY_TIERS_I18N.items():
        for lang in SUPPORTED_LANGUAGES:
            assert lang in lang_map, f"Missing tier translation '{lang}' for '{tier}'"

    for ctype, lang_map in CONSTRUCTION_TYPES_I18N.items():
        for lang in SUPPORTED_LANGUAGES:
            assert lang in lang_map, f"Missing construction type '{lang}' for '{ctype}'"

    for status_key, lang_map in BUDGET_STATUS_I18N.items():
        for lang in SUPPORTED_LANGUAGES:
            assert lang in lang_map, f"Missing budget status '{lang}' for '{status_key}'"


def test_translation_helper_functions() -> None:
    """Tests localized helper functions for categories, tiers, types, and fallback behavior."""
    assert translate_category("Foundation", "hi") == "नींव कार्य (फाउंडेशन)"
    assert translate_category("Foundation", "mr") == "पाया बांधकाम (फाउंडेशन)"
    assert translate_category("Foundation", "en") == "Foundation"

    assert "खुदाई" in translate_category_desc("Foundation", "hi")
    assert "खोदकाम" in translate_category_desc("Foundation", "mr")

    assert translate_quality_tier("premium", "hi") == "उत्कृष्ट (Premium)"
    assert translate_quality_tier("premium", "mr") == "उत्कृष्ट (Premium)"

    assert translate_construction_type("rcc_framed", "hi") == "आरसीसी फ्रेमयुक्त"
    assert translate_construction_type("rcc_framed", "mr") == "आरसीसी फ्रेम"

    assert translate_budget_status("within", "hi") == "बजट के भीतर"
    assert translate_budget_status("within", "mr") == "बजेटमध्ये"

    # Fallback to key when translation missing
    assert t("non_existent_key", "hi", default="Fallback") == "Fallback"


def test_devanagari_font_registration() -> None:
    """Verifies that Noto Sans Devanagari TTF fonts are registered in ReportLab pdfmetrics."""
    registered = register_devanagari_fonts()
    assert registered is True
    assert "NotoSansDevanagari" in pdfmetrics.getRegisteredFontNames()
    assert "NotoSansDevanagari-Bold" in pdfmetrics.getRegisteredFontNames()


def test_generate_pdf_in_all_languages() -> None:
    """Generates PDF reports in English, Hindi, and Marathi, verifying valid PDF bytes."""
    project, estimate = _make_dummy_project_and_estimate()

    for lang in ("en", "hi", "mr"):
        pdf_bytes = generate_estimate_pdf(project, estimate, lang=lang)
        assert isinstance(pdf_bytes, bytes)
        assert pdf_bytes.startswith(b"%PDF")
        assert len(pdf_bytes) > 2000, f"PDF in {lang} should be a non-trivial file"


def test_generate_pdf_invalid_language_fallback() -> None:
    """Invalid language parameter gracefully falls back to English without error."""
    project, estimate = _make_dummy_project_and_estimate()
    pdf_bytes = generate_estimate_pdf(project, estimate, lang="unsupported_lang")
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF")
    assert len(pdf_bytes) > 2000
