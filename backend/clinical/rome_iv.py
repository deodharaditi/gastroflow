"""
Rome IV Diagnostic Criteria — reference data for prompt construction
and synthesis guidance.

Source: Gastroenterology 2016;150:1257-1261 (Rome IV consensus).
This module does NOT make diagnoses — it provides structured criteria
that are injected into the synthesis prompt so the LLM can apply them.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Rome IV Criteria Definitions
# ---------------------------------------------------------------------------

ROME_IV_CRITERIA: dict[str, dict] = {
    "IBS": {
        "full_name": "Irritable Bowel Syndrome",
        "key_criterion": (
            "Recurrent abdominal pain, on average ≥ 1 day/week in the last 3 months, "
            "associated with ≥ 2 of the following: (1) related to defecation, "
            "(2) associated with change in stool frequency, "
            "(3) associated with change in stool form/appearance."
        ),
        "onset": "Onset ≥ 6 months before diagnosis; active for last 3 months.",
        "subtypes": {
            "IBS-C": "Bristol Types 1–2 in >25% of BMs; Types 6–7 in <25%.",
            "IBS-D": "Bristol Types 6–7 in >25% of BMs; Types 1–2 in <25%.",
            "IBS-M": "Both Bristol Types 1–2 and 6–7 each >25% of BMs.",
            "IBS-U": "Does not meet criteria for C, D, or M subtypes.",
        },
        "exclusions": "Organic disease must be excluded (IBD, celiac, colorectal cancer).",
    },
    "FUNCTIONAL_DYSPEPSIA": {
        "full_name": "Functional Dyspepsia",
        "key_criterion": (
            "≥ 1 of the following: (1) bothersome postprandial fullness, "
            "(2) early satiation, (3) epigastric pain, (4) epigastric burning. "
            "No evidence of structural disease to explain symptoms."
        ),
        "onset": "Onset ≥ 6 months; active for last 3 months.",
        "subtypes": {
            "PDS": (
                "Postprandial Distress Syndrome: bothersome postprandial fullness "
                "and/or early satiation ≥ 3 days/week."
            ),
            "EPS": (
                "Epigastric Pain Syndrome: bothersome epigastric pain/burning "
                "≥ 1 day/week, not relieved by defecation."
            ),
        },
        "exclusions": "Upper endoscopy required to exclude peptic ulcer, GERD, malignancy.",
    },
    "FUNCTIONAL_CONSTIPATION": {
        "full_name": "Functional Constipation",
        "key_criterion": (
            "≥ 2 of the following for last 3 months (onset ≥ 6 months): "
            "(1) straining in >25% of defecations, "
            "(2) lumpy or hard stools (Bristol 1–2) in >25%, "
            "(3) sensation of incomplete evacuation in >25%, "
            "(4) sensation of anorectal obstruction/blockage in >25%, "
            "(5) manual maneuvers to facilitate >25%, "
            "(6) fewer than 3 spontaneous BMs/week. "
            "Loose stools rarely present without laxative use."
        ),
        "onset": "Onset ≥ 6 months; active for last 3 months.",
        "subtypes": {},
        "exclusions": "Does not meet IBS criteria.",
    },
    "FUNCTIONAL_DIARRHEA": {
        "full_name": "Functional Diarrhea",
        "key_criterion": (
            "Loose or watery stools (Bristol 6–7) without predominant abdominal pain, "
            "occurring in >25% of defecations. "
            "Onset ≥ 6 months; active for last 3 months."
        ),
        "onset": "Onset ≥ 6 months; active for last 3 months.",
        "subtypes": {},
        "exclusions": "Does not meet IBS criteria (no predominant abdominal pain).",
    },
    "GERD": {
        "full_name": "Gastroesophageal Reflux Disease (Functional Heartburn)",
        "key_criterion": (
            "Troublesome heartburn and/or regurgitation ≥ 2 days/week, "
            "causing quality-of-life impairment."
        ),
        "onset": "Chronic; symptoms impacting daily function.",
        "subtypes": {
            "FUNCTIONAL_HEARTBURN": (
                "Heartburn without evidence of reflux on pH monitoring or endoscopy."
            ),
        },
        "exclusions": "Endoscopy/pH study may be needed to distinguish erosive from functional.",
    },
    "BLOATING_DISTENSION": {
        "full_name": "Functional Abdominal Bloating/Distension",
        "key_criterion": (
            "Recurrent bloating/distension ≥ 1 day/week; more bothersome than other symptoms. "
            "Insufficient criteria for another functional GI disorder."
        ),
        "onset": "Onset ≥ 6 months; active for last 3 months.",
        "subtypes": {},
        "exclusions": "Rule out SIBO, celiac disease.",
    },
}


def format_criteria_for_prompt() -> str:
    """
    Return a compact, structured summary of all Rome IV criteria
    suitable for injection into the synthesis system prompt.
    """
    lines: list[str] = ["=== Rome IV Diagnostic Criteria (2016) ===\n"]
    for key, criteria in ROME_IV_CRITERIA.items():
        lines.append(f"## {criteria['full_name']}")
        lines.append(f"Criterion: {criteria['key_criterion']}")
        lines.append(f"Onset/Duration: {criteria['onset']}")
        if criteria["subtypes"]:
            lines.append("Subtypes:")
            for sub, desc in criteria["subtypes"].items():
                lines.append(f"  - {sub}: {desc}")
        lines.append(f"Exclusions: {criteria['exclusions']}")
        lines.append("")
    return "\n".join(lines)
