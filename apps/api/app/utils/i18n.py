"""Internationalization (i18n) and localization support for BuildSmart AI.

Provides translations and locale helpers for English (en), Hindi (hi), and Marathi (mr).
Supports API responses and bilingual/multilingual PDF generation with Devanagari script.
"""

from typing import Literal

SupportedLanguage = Literal["en", "hi", "mr"]
SUPPORTED_LANGUAGES: tuple[SupportedLanguage, ...] = ("en", "hi", "mr")
DEFAULT_LANGUAGE: SupportedLanguage = "en"

TRANSLATIONS: dict[str, dict[SupportedLanguage, str]] = {
    # Header
    "brand_title": {
        "en": "BuildSmart AI",
        "hi": "BuildSmart AI",
        "mr": "BuildSmart AI",
    },
    "header_sub": {
        "en": "Bottom-Up Construction Cost Estimation & Bill of Quantities",
        "hi": "बॉटम-अप निर्माण लागत अनुमान एवं कार्य मात्रा सूची (BOQ)",
        "mr": "तळ-ते-वर बांधकाम खर्च अंदाज व परिमाण सूची (BOQ)",
    },
    "region_sub": {
        "en": "Pune Region · PWD SSR 2022-23",
        "hi": "पुणे क्षेत्र · पीडब्ल्यूडी एसएसआर 2022-23",
        "mr": "पुणे विभाग · सार्वजनिक बांधकाम विभाग दरसूची (SSR) २०२२-२३",
    },
    "estimate_report": {
        "en": "ESTIMATE REPORT",
        "hi": "लागत अनुमान रिपोर्ट",
        "mr": "खर्च अंदाज अहवाल",
    },
    "date_label": {
        "en": "DATE",
        "hi": "दिनांक",
        "mr": "तारीख",
    },
    "mock_banner": {
        "en": "DEMO / PROTOTYPE ESTIMATE (Simulated planning data)",
        "hi": "डेमो / प्रोटोटाइप अनुमान (सिम्युलेटेड योजना डेटा)",
        "mr": "डेमो / प्रोटोटाइप अंदाज (प्रायोगिक नियोजन डेटा)",
    },
    # Section Headings
    "sec_project_specs": {
        "en": "01 / PROJECT SPECIFICATIONS",
        "hi": "01 / परियोजना विवरण",
        "mr": "01 / प्रकल्पाचा तपशील",
    },
    "sec_cost_summary": {
        "en": "02 / COST ESTIMATE & RANGE SUMMARY",
        "hi": "02 / लागत अनुमान एवं सीमा सारांश",
        "mr": "02 / खर्च अंदाज आणि संभाव्य मर्यादा सारांश",
    },
    "sec_boq_breakdown": {
        "en": "03 / 9-CATEGORY BOQ BREAKDOWN (MAHARASHTRA SSR 2022-23)",
        "hi": "03 / 9-श्रेणी बीओक्यू विवरण (महाराष्ट्र एसएसआर 2022-23)",
        "mr": "03 / ९-प्रवर्ग दरसूची तपशील (महाराष्ट्र SSR २०२२-२३)",
    },
    "sec_cost_drivers": {
        "en": "04 / KEY COST DRIVERS",
        "hi": "04 / प्रमुख लागत घटक",
        "mr": "04 / प्रमुख खर्च घटक",
    },
    # Specs Table Labels
    "lbl_project_name": {
        "en": "Project Name:",
        "hi": "परियोजना नाम:",
        "mr": "प्रकल्पाचे नाव:",
    },
    "lbl_location_zone": {
        "en": "Location Zone:",
        "hi": "स्थान क्षेत्र:",
        "mr": "स्थान विभाग:",
    },
    "lbl_built_up_area": {
        "en": "Total Built-Up Area:",
        "hi": "कुल निर्मित क्षेत्र:",
        "mr": "एकूण बांधकाम क्षेत्र:",
    },
    "lbl_configuration": {
        "en": "Configuration:",
        "hi": "संरचना:",
        "mr": "रचना:",
    },
    "lbl_quality_tier": {
        "en": "Quality Tier:",
        "hi": "गुणवत्ता स्तर:",
        "mr": "दर्जा वर्ग:",
    },
    "lbl_structural_type": {
        "en": "Structural Type:",
        "hi": "संरचना प्रकार:",
        "mr": "बांधकाम पद्धत:",
    },
    "lbl_plot_area": {
        "en": "Plot Area:",
        "hi": "भूखंड क्षेत्र:",
        "mr": "प्लॉट क्षेत्र:",
    },
    "lbl_estimation_basis": {
        "en": "Estimation Basis:",
        "hi": "अनुमान आधार:",
        "mr": "अंदाज आधार:",
    },
    "val_bottom_up_basis": {
        "en": "Bottom-Up Civil Norms",
        "hi": "सिविल इंजीनियरिंग मानक",
        "mr": "स्थापत्य अभियांत्रिकी निकष",
    },
    "val_not_specified": {
        "en": "Not specified",
        "hi": "निर्दिष्ट नहीं",
        "mr": "नमूद नाही",
    },
    "val_floors_suffix": {
        "en": "Floor(s)",
        "hi": "मंज़िल",
        "mr": "मजले",
    },
    # Cost Summary
    "cost_p10_sub": {
        "en": "P10 Low (-10% Baseline Range)",
        "hi": "P10 न्यूनतम (-10% आधारभूत सीमा)",
        "mr": "P10 किमान (-१०% आधारभूत मर्यादा)",
    },
    "cost_p50_sub": {
        "en": "P50 Expected Median Total",
        "hi": "P50 अपेक्षित औसत कुल",
        "mr": "P50 अपेक्षित सरासरी एकूण",
    },
    "cost_p90_sub": {
        "en": "P90 High (+15% Contingency)",
        "hi": "P90 अधिकतम (+15% आकस्मिकता)",
        "mr": "P90 कमाल (+१५% आकस्मिक खर्च)",
    },
    "lbl_target_budget": {
        "en": "Target Budget:",
        "hi": "लक्षित बजट:",
        "mr": "नियोजित बजेट:",
    },
    "lbl_assessment": {
        "en": "Assessment:",
        "hi": "मूल्यांकन:",
        "mr": "मूल्यांकन:",
    },
    "lbl_confidence": {
        "en": "Confidence:",
        "hi": "विश्वास स्तर:",
        "mr": "विश्वासार्हता:",
    },
    # BOQ Table Columns
    "col_category": {
        "en": "Category",
        "hi": "श्रेणी",
        "mr": "प्रवर्ग",
    },
    "col_estimated_cost": {
        "en": "Estimated Cost",
        "hi": "अनुमानित लागत",
        "mr": "अंदाजित खर्च",
    },
    "col_share_pct": {
        "en": "Share (%)",
        "hi": "हिस्सा (%)",
        "mr": "वाटा (%)",
    },
    "col_scope_included": {
        "en": "Primary Scope Included",
        "hi": "शामिल प्राथमिक कार्य",
        "mr": "समाविष्ट प्रमुख कामे",
    },
    "total_p50_row": {
        "en": "Total Estimated Cost (P50)",
        "hi": "कुल अनुमानित लागत (P50)",
        "mr": "एकूण अंदाजित खर्च (P50)",
    },
    "total_p50_scope": {
        "en": "Sum of all 9 preliminary work categories",
        "hi": "सभी 9 कार्य श्रेणियों का योग",
        "mr": "सर्व ९ प्राथमिक कार्य प्रवर्गांची बेरीज",
    },
    # Disclaimer and Footer
    "disclaimer_title": {
        "en": "DATA PROVENANCE & LEGAL DISCLAIMER:",
        "hi": "डेटा स्रोत एवं कानूनी अस्वीकरण:",
        "mr": "माहिती स्रोत आणि कायदेशीर सूचना:",
    },
    "disclaimer_body": {
        "en": (
            "Rates sourced from Maharashtra Public Works Department (PWD) State Schedule "
            "of Rates (SSR) 2022-23 (Pune Region) and official Minimum Wage notifications. "
            "Quantities are derived from civil engineering heuristics. This preliminary "
            "estimate is generated for feasibility budgeting only. It does not constitute an "
            "architectural drawing, structural certification, or binding contractor quotation."
        ),
        "hi": (
            "दरें महाराष्ट्र लोक निर्माण विभाग (PWD) राज्य दर अनुसूची (SSR) 2022-23 (पुणे क्षेत्र) "
            "एवं आधिकारिक न्यूनतम वेतन अधिसूचनाओं से ली गई हैं। मात्राएं सिविल इंजीनियरिंग "
            "मानकों पर आधारित हैं। यह प्रारंभिक अनुमान केवल बजट योजना के लिए है और बाध्यकारी अनुबंध नहीं है।"
        ),
        "mr": (
            "दर हे महाराष्ट्र सार्वजनिक बांधकाम विभाग (PWD) राज्य दरसूची (SSR) २०२२-२३ (पुणे विभाग) "
            "आणि अधिकृत किमान वेतन अधिसूचनेवर आधारित आहेत. परिमाणे स्थापत्य अभियांत्रिकी निकषांनुसार "
            "काढलेली आहेत. हा प्राथमिक अंदाज केवळ नियोजन हेतूसाठी असून बंधनकारक कंत्राटी दरपत्रक नाही."
        ),
    },
    "running_footer": {
        "en": "BuildSmart AI · Residential Construction Cost Estimation · Planning Document",
        "hi": "BuildSmart AI · आवासीय निर्माण लागत अनुमान · योजना दस्तावेज़",
        "mr": "BuildSmart AI · निवासी बांधकाम खर्च अंदाज · नियोजन दस्तऐवज",
    },
    "page_number": {
        "en": "Page {page} of {total}",
        "hi": "पृष्ठ {page} का {total}",
        "mr": "पान {page} पैकी {total}",
    },
}

CATEGORIES_I18N: dict[str, dict[SupportedLanguage, str]] = {
    "Foundation": {
        "en": "Foundation",
        "hi": "नींव कार्य (फाउंडेशन)",
        "mr": "पाया बांधकाम (फाउंडेशन)",
    },
    "Structure": {
        "en": "Structure",
        "hi": "आरसीसी संरचना (स्ट्रक्चर)",
        "mr": "आरसीसी रचना (स्ट्रक्चर)",
    },
    "Masonry": {
        "en": "Masonry",
        "hi": "चिनाई कार्य (मेसनरी)",
        "mr": "भिंतीचे बांधकाम (मेसनरी)",
    },
    "Roofing": {
        "en": "Roofing",
        "hi": "छत एवं जलरोधन (रूफिंग)",
        "mr": "छत व जलरोधक (रूफिंग)",
    },
    "Flooring": {
        "en": "Flooring",
        "hi": "फर्श एवं टाइल्स (फ्लोरिंग)",
        "mr": "फरशीकाम (फ्लोरिंग)",
    },
    "Plumbing": {
        "en": "Plumbing",
        "hi": "प्लंबिंग एवं स्वच्छता",
        "mr": "प्लंबिंग व जलनिस्सारण",
    },
    "Electrical": {
        "en": "Electrical",
        "hi": "विद्युतीकरण (इलेक्ट्रिकल)",
        "mr": "विद्युतीकरण (इलेक्ट्रिकल)",
    },
    "Finishing": {
        "en": "Finishing",
        "hi": "प्लास्टर एवं रंगाई (फिनिशिंग)",
        "mr": "प्लास्टर व रंगकाम (फिनिशिंग)",
    },
    "Labour": {
        "en": "Labour",
        "hi": "श्रम लागत (मजदूरी)",
        "mr": "मजुरी खर्च (लेबर)",
    },
}

CATEGORY_DESCRIPTIONS_I18N: dict[str, dict[SupportedLanguage, str]] = {
    "Foundation": {
        "en": "Excavation in hard/soft strata, PCC 1:4:8, rubble soling & backfilling",
        "hi": "खुदाई, पीसीसी 1:4:8, सोलिंग एवं बैकफ़िलिंग कार्य",
        "mr": "पाया खोदकाम, पीसीसी १:४:८, सोलिंग व माती भराव",
    },
    "Structure": {
        "en": "RCC M-20 framing (columns, beams, slabs) & Fe500D TMT reinforcement",
        "hi": "आरसीसी एम-20 फ्रेमिंग (कॉलम, बीम, स्लैब) एवं Fe500D टीएमटी स्टील",
        "mr": "आरसीसी एम-२० फ्रेमिंग (खांब, बीम, स्लॅब) व Fe500D टीएमटी स्टील",
    },
    "Masonry": {
        "en": "Burnt clay brickwork / AAC blocks in cement mortar 1:6",
        "hi": "लाल ईंट चिनाई / एएसी ब्लॉक सीमेंट मोर्टार 1:6",
        "mr": "भाजक्या विटांचे बांधकाम / एएसी ब्लॉक्स १:६ सिमेंट गिलावा",
    },
    "Roofing": {
        "en": "Terrace waterproofing, thermal insulation & rain drainage slopes",
        "hi": "छत वॉटरप्रूफिंग, थर्मल इन्सुलेशन एवं जल निकासी ढलान",
        "mr": "टेरेस वॉटरप्रूफिंग, उष्णतारोधक थर व पाण्याचा उतार",
    },
    "Flooring": {
        "en": "Vitrified living/bedroom tiles, anti-skid bathroom tiles & skirting",
        "hi": "विट्रिफाइड फर्श टाइल्स, एंटी-स्किड बाथरूम टाइल्स व स्कर्टिंग",
        "mr": "व्हिट्रिफाइड टाइल्स, बाथरूम अँटी-स्किड टाइल्स व स्कर्टिंग",
    },
    "Plumbing": {
        "en": "CPVC concealed piping, sanitary lines, drainage & inspection chambers",
        "hi": "सीपीवीसी गुप्त पाइपिंग, स्वच्छता लाइनें व जल निकासी चैंबर",
        "mr": "सीपीव्हीसी पाइपिंग, सांडपाणी वाहिन्या व तपासणी चेंबर्स",
    },
    "Electrical": {
        "en": "Concealed conduits, copper wiring, modular switches & earthing pits",
        "hi": "गुप्त वायरिंग, कॉपर वायर, मॉड्यूलर स्विच एवं अर्थिंग",
        "mr": "कन्सील्ड पाइपिंग, तांब्याची वायरिंग, मॉड्युलर स्विचेस व अर्थिंग",
    },
    "Finishing": {
        "en": "Internal smooth cement plaster, external sand-face & exterior paint",
        "hi": "आंतरिक चिकना प्लास्टर, बाहरी सैंड-फेस प्लास्टर व पेंटिंग",
        "mr": "आतील गुळगुळीत प्लास्टर, बाहेरील सँड-फेस प्लास्टर व रंगकाम",
    },
    "Labour": {
        "en": "Consolidated skilled & unskilled trade labour component (Decision D-02)",
        "hi": "कुशल एवं अकुशल कारीगरों का संयुक्त श्रम घटक (निर्णय D-02)",
        "mr": "कुशल व अकुशल कारागिरांचा एकत्रित मजुरी खर्च (निर्णय D-02)",
    },
}

QUALITY_TIERS_I18N: dict[str, dict[SupportedLanguage, str]] = {
    "economy": {
        "en": "Economy",
        "hi": "किफायती (Economy)",
        "mr": "किफायतशीर (Economy)",
    },
    "standard": {
        "en": "Standard",
        "hi": "मानक (Standard)",
        "mr": "प्रमाणित (Standard)",
    },
    "premium": {
        "en": "Premium",
        "hi": "उत्कृष्ट (Premium)",
        "mr": "उत्कृष्ट (Premium)",
    },
}

CONSTRUCTION_TYPES_I18N: dict[str, dict[SupportedLanguage, str]] = {
    "rcc_framed": {
        "en": "RCC Framed",
        "hi": "आरसीसी फ्रेमयुक्त",
        "mr": "आरसीसी फ्रेम",
    },
    "load_bearing": {
        "en": "Load Bearing",
        "hi": "लोड बेयरिंग",
        "mr": "लोड बेअरिंग",
    },
}

BUDGET_STATUS_I18N: dict[str, dict[SupportedLanguage, str]] = {
    "within": {
        "en": "WITHIN",
        "hi": "बजट के भीतर",
        "mr": "बजेटमध्ये",
    },
    "tight": {
        "en": "TIGHT",
        "hi": "सीमित (टाइट)",
        "mr": "मर्यादित",
    },
    "below_minimum": {
        "en": "BELOW MINIMUM",
        "hi": "न्यूनतम से कम",
        "mr": "किमानपेक्षा कमी",
    },
    "not_provided": {
        "en": "NOT PROVIDED",
        "hi": "प्रदान नहीं किया",
        "mr": "नमूद नाही",
    },
}


def t(key: str, lang: str = "en", default: str | None = None) -> str:
    """Retrieve localized string for key and language code."""
    valid_lang: SupportedLanguage = lang if lang in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE
    if key in TRANSLATIONS:
        return TRANSLATIONS[key].get(valid_lang, TRANSLATIONS[key]["en"])
    return default if default is not None else key


def translate_category(category: str, lang: str = "en") -> str:
    """Retrieve localized name for a construction category."""
    valid_lang: SupportedLanguage = lang if lang in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE
    if category in CATEGORIES_I18N:
        return CATEGORIES_I18N[category].get(valid_lang, category)
    return category


def translate_category_desc(category: str, lang: str = "en") -> str:
    """Retrieve localized description for a construction category."""
    valid_lang: SupportedLanguage = lang if lang in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE
    if category in CATEGORY_DESCRIPTIONS_I18N:
        return CATEGORY_DESCRIPTIONS_I18N[category].get(valid_lang, "")
    return ""


def translate_quality_tier(tier: str, lang: str = "en") -> str:
    """Retrieve localized quality tier label."""
    valid_lang: SupportedLanguage = lang if lang in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE
    key = tier.lower()
    if key in QUALITY_TIERS_I18N:
        return QUALITY_TIERS_I18N[key].get(valid_lang, tier.title())
    return tier.title()


def translate_construction_type(ctype: str, lang: str = "en") -> str:
    """Retrieve localized construction type label."""
    valid_lang: SupportedLanguage = lang if lang in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE
    key = ctype.lower().replace(" ", "_")
    if key in CONSTRUCTION_TYPES_I18N:
        return CONSTRUCTION_TYPES_I18N[key].get(valid_lang, ctype.title())
    return ctype.title()


def translate_budget_status(status_val: str, lang: str = "en") -> str:
    """Retrieve localized budget assessment status label."""
    valid_lang: SupportedLanguage = lang if lang in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE
    key = status_val.lower()
    if key in BUDGET_STATUS_I18N:
        return BUDGET_STATUS_I18N[key].get(valid_lang, status_val.upper())
    return status_val.upper()
