"""Bristol Stool Scale definitions and clinical mappings."""

from __future__ import annotations

BRISTOL_DESCRIPTIONS: dict[int, dict[str, str]] = {
    1: {
        "label": "Type 1",
        "appearance": "Separate hard lumps, like nuts (hard to pass)",
        "clinical_meaning": "Severe constipation",
    },
    2: {
        "label": "Type 2",
        "appearance": "Sausage-shaped but lumpy",
        "clinical_meaning": "Mild constipation",
    },
    3: {
        "label": "Type 3",
        "appearance": "Like a sausage but with cracks on its surface",
        "clinical_meaning": "Normal (tending toward constipation)",
    },
    4: {
        "label": "Type 4",
        "appearance": "Like a sausage or snake, smooth and soft",
        "clinical_meaning": "Normal / Ideal",
    },
    5: {
        "label": "Type 5",
        "appearance": "Soft blobs with clear-cut edges (passed easily)",
        "clinical_meaning": "Lacking fiber; tending toward diarrhea",
    },
    6: {
        "label": "Type 6",
        "appearance": "Fluffy pieces with ragged edges, a mushy stool",
        "clinical_meaning": "Mild diarrhea",
    },
    7: {
        "label": "Type 7",
        "appearance": "Watery, no solid pieces, entirely liquid",
        "clinical_meaning": "Severe diarrhea",
    },
}


def describe_bristol(type_num: int) -> str:
    """Return a human-readable description for a Bristol type."""
    entry = BRISTOL_DESCRIPTIONS.get(type_num)
    if not entry:
        return f"Unknown Bristol type: {type_num}"
    return (
        f"Bristol Type {type_num} — {entry['appearance']} "
        f"({entry['clinical_meaning']})"
    )


def bristol_to_ibs_subtype(type_num: int) -> str:
    """
    Map a dominant Bristol type to the IBS subtype direction.
    Rome IV uses proportion of abnormal stools (>25%), but for a
    single dominant report we return the clinical direction.
    """
    if type_num <= 2:
        return "IBS-C (constipation-predominant)"
    elif type_num >= 6:
        return "IBS-D (diarrhea-predominant)"
    else:
        return "IBS-M or IBS-U (mixed/unclassified) — further frequency data needed"


BRISTOL_SUMMARY_FOR_PROMPT = "\n".join(
    f"  Type {k}: {v['appearance']} — {v['clinical_meaning']}"
    for k, v in BRISTOL_DESCRIPTIONS.items()
)
