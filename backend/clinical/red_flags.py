"""
Red Flag triage for GI intake.

These are alarm features that warrant urgent or emergent gastroenterology
referral and must be prominently surfaced in the SOAP assessment.

Reference: ACG guidelines + Rome IV Red Flag criteria.
"""

from __future__ import annotations
import re

# ---------------------------------------------------------------------------
# Red flag definitions
# ---------------------------------------------------------------------------

RED_FLAG_PATTERNS: list[dict] = [
    {
        "id": "rectal_bleeding",
        "label": "Rectal bleeding / blood in stool",
        "urgency": "urgent",
        "patterns": [
            r"\b(blood|bloody|bleeding)\b",
            r"\brectal bleed",
            r"\bmelena\b",
            r"\bblack (stool|tarry|poo|poop)\b",
            r"\btarry stool",
            r"\bhematochezia\b",
        ],
    },
    {
        "id": "weight_loss",
        "label": "Unintentional weight loss",
        "urgency": "urgent",
        "patterns": [
            r"\bweight loss\b",
            r"\blosing weight\b",
            r"\blost weight\b",
            r"\bunintentional(ly)? (lost|losing)\b",
        ],
    },
    {
        "id": "dysphagia",
        "label": "Dysphagia / difficulty swallowing",
        "urgency": "urgent",
        "patterns": [
            r"\bdysphagia\b",
            r"\bdifficulty swallowing\b",
            r"\bhard to swallow\b",
            r"\bpainful swallowing\b",
            r"\bodynophagia\b",
            r"\bfood (gets )?stuck\b",
        ],
    },
    {
        "id": "anemia",
        "label": "Iron-deficiency anemia",
        "urgency": "urgent",
        "patterns": [
            r"\banemia\b",
            r"\banaemia\b",
            r"\biron deficien",
            r"\blow (iron|hemoglobin|haemoglobin)\b",
            r"\bfatigue.{0,30}(pale|pallor)\b",
        ],
    },
    {
        "id": "nocturnal_symptoms",
        "label": "Nocturnal symptoms (waking from sleep)",
        "urgency": "urgent",
        "patterns": [
            r"\bwake(s)? (up )?(at night|from sleep)\b",
            r"\bnocturnal\b",
            r"\bright(s)? me up\b",
            r"\bwoken (up )?by (pain|diarrhea|diarrhoea)\b",
            r"\bat night.{0,20}(pain|diarrhea|diarrhoea|cramp)\b",
        ],
    },
    {
        "id": "fever",
        "label": "Unexplained fever",
        "urgency": "urgent",
        "patterns": [
            r"\bfever\b",
            r"\bfebrile\b",
            r"\bhigh temperature\b",
            r"\b(38|39|40|41)\s*°?\s*(c|celsius|f|fahrenheit)\b",
        ],
    },
    {
        "id": "night_sweats",
        "label": "Night sweats",
        "urgency": "urgent",
        "patterns": [
            r"\bnight sweat",
            r"\bsweating at night\b",
            r"\bprofuse sweating\b",
        ],
    },
    {
        "id": "family_history_crc",
        "label": "Family history of colorectal cancer / IBD / celiac",
        "urgency": "urgent",
        "patterns": [
            r"\bfamily history.{0,30}(colon|colorectal|rectal|bowel) cancer\b",
            r"\b(father|mother|parent|sibling|brother|sister).{0,30}(colon|colorectal|cancer|crohn|colitis)\b",
            r"\bfamily history.{0,20}(ibd|crohn|colitis|celiac|coeliac)\b",
            r"\bfamilial (adenomatous|polyposis)\b",
        ],
    },
    {
        "id": "age_50_new_onset",
        "label": "Age > 50 with new-onset symptoms",
        "urgency": "urgent",
        "patterns": [
            # This flag is best set programmatically when age is extracted.
            # The pattern below is a fallback for inline mentions.
            r"\b(5[0-9]|6\d|7\d|8\d|9\d)\s*(years?\s*old|yr\s*old|yo)\b.{0,100}(new|recent|just started|start(ed|ing))\b",
        ],
    },
    {
        "id": "palpable_mass",
        "label": "Palpable abdominal mass",
        "urgency": "emergent",
        "patterns": [
            r"\b(lump|mass|growth)\b.{0,30}(abdomen|stomach|belly|bowel|gut)\b",
            r"\babdominal (lump|mass|growth)\b",
            r"\bcan feel something\b",
        ],
    },
]


def triage_red_flags(text: str) -> list[str]:
    """
    Scan free-text for red flag keywords.
    Returns a list of unique red flag labels found.
    """
    text_lower = text.lower()
    found: list[str] = []

    for flag in RED_FLAG_PATTERNS:
        for pattern in flag["patterns"]:
            if re.search(pattern, text_lower):
                found.append(flag["label"])
                break  # one match per flag is enough

    return found


def get_urgency_level(red_flags: list[str]) -> str:
    """
    Derive overall urgency from accumulated red flags.
    Returns "emergent", "urgent", or "routine".
    """
    if not red_flags:
        return "routine"

    flag_ids_found = set()
    for flag in RED_FLAG_PATTERNS:
        if flag["label"] in red_flags:
            flag_ids_found.add(flag["urgency"])

    if "emergent" in flag_ids_found:
        return "emergent"
    if "urgent" in flag_ids_found:
        return "urgent"
    return "routine"
