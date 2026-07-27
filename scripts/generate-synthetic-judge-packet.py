#!/usr/bin/env python3
"""Generate the fully fictional ContextFirst Nexus judge packet."""

from __future__ import annotations

import json
from dataclasses import dataclass
from html import escape
from pathlib import Path
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = REPO_ROOT / "output" / "pdf" / "cfn-nila-verin-packet"
PUBLIC_DIR = REPO_ROOT / "public" / "fixtures" / "cfn-nila-verin-packet"
PACKET_REFERENCE = "CFN-TRAINING-NV-01"
SYNTHETIC_LABEL = (
    "SYNTHETIC TRAINING RECORD - NOT A REAL PERSON, ORGANIZATION, OR CASE"
)

INK = colors.HexColor("#101A35")
INK_MUTED = colors.HexColor("#586174")
PAPER = colors.HexColor("#FBFAF7")
LINE = colors.HexColor("#D8D3CA")
BRAND = colors.HexColor("#C8873A")
BRAND_PALE = colors.HexColor("#F8E9D5")
BLUE_PALE = colors.HexColor("#EAF0F8")
GREEN_PALE = colors.HexColor("#E7F0E5")
RED_PALE = colors.HexColor("#F8E4DF")
GREY_PALE = colors.HexColor("#F0EEE9")


Block = tuple


@dataclass(frozen=True)
class PageSpec:
    label: str
    summary: str
    blocks: tuple[Block, ...]


@dataclass(frozen=True)
class DocumentSpec:
    document_id: str
    filename: str
    title: str
    source_type: str
    provenance: str
    pages: tuple[PageSpec, ...]


def section(title: str, body: str) -> Block:
    return ("section", title, body)


def note(title: str, body: str, tone: str = "neutral") -> Block:
    return ("note", title, body, tone)


def table(headers: Iterable[str], rows: Iterable[Iterable[str]], widths=None) -> Block:
    return ("table", tuple(headers), tuple(tuple(row) for row in rows), widths)


def bullets(title: str, items: Iterable[str]) -> Block:
    return ("bullets", title, tuple(items))


def messages(rows: Iterable[tuple[str, str, str]]) -> Block:
    return ("messages", tuple(rows))


def para(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(escape(text).replace("\n", "<br/>"), style)


def register_fonts() -> tuple[str, str]:
    candidates = [
        (
            Path("/System/Library/Fonts/Supplemental/Georgia.ttf"),
            Path("/System/Library/Fonts/Supplemental/Georgia Bold.ttf"),
        ),
        (
            Path("/Library/Fonts/Arial.ttf"),
            Path("/Library/Fonts/Arial Bold.ttf"),
        ),
    ]
    for regular, bold in candidates:
        if regular.exists() and bold.exists():
            pdfmetrics.registerFont(TTFont("CFNRegular", str(regular)))
            pdfmetrics.registerFont(TTFont("CFNBold", str(bold)))
            return "CFNRegular", "CFNBold"
    return "Helvetica", "Helvetica-Bold"


REGULAR_FONT, BOLD_FONT = register_fonts()
BASE = getSampleStyleSheet()
STYLES = {
    "title": ParagraphStyle(
        "PacketTitle",
        parent=BASE["Title"],
        fontName=BOLD_FONT,
        fontSize=21,
        leading=24,
        textColor=INK,
        alignment=TA_LEFT,
        spaceAfter=4,
    ),
    "eyebrow": ParagraphStyle(
        "Eyebrow",
        parent=BASE["Normal"],
        fontName=BOLD_FONT,
        fontSize=7.5,
        leading=10,
        textColor=BRAND,
        tracking=1.3,
        uppercase=True,
    ),
    "summary": ParagraphStyle(
        "Summary",
        parent=BASE["Normal"],
        fontName=REGULAR_FONT,
        fontSize=10,
        leading=14,
        textColor=INK_MUTED,
        spaceAfter=7,
    ),
    "h2": ParagraphStyle(
        "Section",
        parent=BASE["Heading2"],
        fontName=BOLD_FONT,
        fontSize=11.5,
        leading=14,
        textColor=INK,
        spaceBefore=3,
        spaceAfter=4,
    ),
    "body": ParagraphStyle(
        "Body",
        parent=BASE["BodyText"],
        fontName=REGULAR_FONT,
        fontSize=9.2,
        leading=13,
        textColor=INK,
        spaceAfter=5,
    ),
    "small": ParagraphStyle(
        "Small",
        parent=BASE["BodyText"],
        fontName=REGULAR_FONT,
        fontSize=7.8,
        leading=10.5,
        textColor=INK_MUTED,
    ),
    "table_header": ParagraphStyle(
        "TableHeader",
        parent=BASE["Normal"],
        fontName=BOLD_FONT,
        fontSize=7.5,
        leading=9.5,
        textColor=INK,
    ),
    "table_cell": ParagraphStyle(
        "TableCell",
        parent=BASE["Normal"],
        fontName=REGULAR_FONT,
        fontSize=7.8,
        leading=10.2,
        textColor=INK,
    ),
    "note_title": ParagraphStyle(
        "NoteTitle",
        parent=BASE["Normal"],
        fontName=BOLD_FONT,
        fontSize=9,
        leading=11,
        textColor=INK,
    ),
    "note_body": ParagraphStyle(
        "NoteBody",
        parent=BASE["Normal"],
        fontName=REGULAR_FONT,
        fontSize=8.4,
        leading=11.5,
        textColor=INK,
    ),
    "message_meta": ParagraphStyle(
        "MessageMeta",
        parent=BASE["Normal"],
        fontName=BOLD_FONT,
        fontSize=7.3,
        leading=9,
        textColor=INK_MUTED,
    ),
    "message": ParagraphStyle(
        "Message",
        parent=BASE["Normal"],
        fontName=REGULAR_FONT,
        fontSize=8.6,
        leading=12,
        textColor=INK,
    ),
}


def draw_page(canvas, document, spec: DocumentSpec):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)

    canvas.setFillColor(BRAND)
    canvas.rect(0, height - 13 * mm, width, 13 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont(BOLD_FONT, 7.4)
    canvas.drawString(18 * mm, height - 8.2 * mm, SYNTHETIC_LABEL)
    canvas.setFont(REGULAR_FONT, 7.2)
    canvas.drawRightString(
        width - 18 * mm,
        height - 8.2 * mm,
        f"{spec.document_id} | {PACKET_REFERENCE}",
    )

    canvas.setStrokeColor(LINE)
    canvas.line(18 * mm, 13 * mm, width - 18 * mm, 13 * mm)
    canvas.setFillColor(INK_MUTED)
    canvas.setFont(REGULAR_FONT, 7)
    canvas.drawString(18 * mm, 8.5 * mm, "Fictional source material for product demonstration")
    canvas.drawRightString(
        width - 18 * mm,
        8.5 * mm,
        f"Page {canvas.getPageNumber()} of {len(spec.pages)}",
    )
    canvas.restoreState()


def render_block(block: Block):
    kind = block[0]
    if kind == "section":
        _, title, body = block
        return [
            Paragraph(escape(title), STYLES["h2"]),
            para(body, STYLES["body"]),
        ]

    if kind == "bullets":
        _, title, items = block
        rows = []
        for item in items:
            rows.append(
                [
                    Paragraph("<b>-</b>", STYLES["body"]),
                    para(item, STYLES["body"]),
                ]
            )
        bullet_table = Table(rows, colWidths=[4 * mm, 159 * mm], hAlign="LEFT")
        bullet_table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 2),
                    ("TOPPADDING", (0, 0), (-1, -1), 1),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                ]
            )
        )
        return [Paragraph(escape(title), STYLES["h2"]), bullet_table, Spacer(1, 3 * mm)]

    if kind == "note":
        _, title, body, tone = block
        background = {
            "warning": BRAND_PALE,
            "danger": RED_PALE,
            "positive": GREEN_PALE,
            "neutral": BLUE_PALE,
        }.get(tone, BLUE_PALE)
        content = [
            [
                Paragraph(escape(title), STYLES["note_title"]),
                para(body, STYLES["note_body"]),
            ]
        ]
        note_table = Table(content, colWidths=[47 * mm, 116 * mm], hAlign="LEFT")
        note_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), background),
                    ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 7),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ]
            )
        )
        return [Spacer(1, 2 * mm), note_table, Spacer(1, 3 * mm)]

    if kind == "table":
        _, headers, rows, widths = block
        data = [
            [Paragraph(escape(cell), STYLES["table_header"]) for cell in headers],
            *[
                [Paragraph(escape(cell), STYLES["table_cell"]) for cell in row]
                for row in rows
            ],
        ]
        if widths:
            col_widths = [width * mm for width in widths]
        else:
            col_widths = [163 * mm / len(headers)] * len(headers)
        grid = Table(data, colWidths=col_widths, repeatRows=1, hAlign="LEFT")
        grid.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), GREY_PALE),
                    ("TEXTCOLOR", (0, 0), (-1, 0), INK),
                    ("GRID", (0, 0), (-1, -1), 0.55, LINE),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PAPER]),
                ]
            )
        )
        return [Spacer(1, 1 * mm), grid, Spacer(1, 3 * mm)]

    if kind == "messages":
        _, rows = block
        rendered = []
        for timestamp, sender, body in rows:
            bubble = Table(
                [
                    [Paragraph(f"{escape(timestamp)} | {escape(sender)}", STYLES["message_meta"])],
                    [para(body, STYLES["message"])],
                ],
                colWidths=[154 * mm],
                hAlign="LEFT",
            )
            bubble.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), BLUE_PALE if sender != "Nila Verin" else GREEN_PALE),
                        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                        ("LEFTPADDING", (0, 0), (-1, -1), 8),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                        ("TOPPADDING", (0, 0), (-1, -1), 5),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ]
                )
            )
            rendered.extend([bubble, Spacer(1, 2.2 * mm)])
        return rendered

    raise ValueError(f"Unknown block type: {kind}")


def build_document(spec: DocumentSpec, output_dir: Path):
    output_path = output_dir / spec.filename
    document = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=23 * mm,
        leftMargin=23 * mm,
        topMargin=21 * mm,
        bottomMargin=18 * mm,
        title=spec.title,
        author="ContextFirst Nexus synthetic fixture generator",
        subject=f"{SYNTHETIC_LABEL}. Packet {PACKET_REFERENCE}.",
        creator="ContextFirst Nexus",
    )

    story = []
    for page_index, page in enumerate(spec.pages):
        if page_index:
            story.append(PageBreak())
        story.extend(
            [
                Paragraph(
                    f"{escape(spec.document_id)} / {escape(spec.source_type.upper())}",
                    STYLES["eyebrow"],
                ),
                Paragraph(escape(spec.title), STYLES["title"]),
                Paragraph(
                    f"{escape(page.label)} | Provenance: {escape(spec.provenance)}",
                    STYLES["eyebrow"],
                ),
                Spacer(1, 2 * mm),
                para(page.summary, STYLES["summary"]),
                Spacer(1, 1 * mm),
            ]
        )
        for block in page.blocks:
            rendered = render_block(block)
            if block[0] == "note":
                story.append(KeepTogether(rendered))
            else:
                story.extend(rendered)

    document.build(
        story,
        onFirstPage=lambda canvas, doc: draw_page(canvas, doc, spec),
        onLaterPages=lambda canvas, doc: draw_page(canvas, doc, spec),
    )


def specs() -> tuple[DocumentSpec, ...]:
    return (
        DocumentSpec(
            "D01",
            "01_case_notice_and_packet_index.pdf",
            "Fictional Case Notice and Packet Index",
            "Other",
            "fixture-authored synthetic notice",
            (
                PageSpec(
                    "Scope and non-use notice",
                    "This notice identifies the packet as fictional training material and defines the limits of any review.",
                    (
                        note(
                            "Demonstration boundary",
                            "This packet does not determine trafficking, victim status, guilt, credibility, legal eligibility, or case outcome. Every source must be assessed by a qualified practitioner.",
                            "warning",
                        ),
                        table(
                            ("Field", "Fictional value"),
                            (
                                ("Packet reference", PACKET_REFERENCE),
                                ("Person", "Nila Verin, also referred to as N. Vale"),
                                ("Origin / destination", "Jurisdiction J-01 / Jurisdiction J-02, both fictional"),
                                ("Proceeding", "J-02 v. N. Vale, fictional"),
                                ("Review purpose", "Prepare a source-grounded practitioner handoff"),
                            ),
                            (46, 117),
                        ),
                        bullets(
                            "Permitted demonstration uses",
                            (
                                "Browser-local PDF extraction and source-health review.",
                                "Identifier masking, deterministic leak checking, and sanitized derivatives.",
                                "Source-grounded analysis proposals, human review, gaps, Nexus relationships, and Timeline.",
                            ),
                        ),
                    ),
                ),
                PageSpec(
                    "Packet index",
                    "Seventeen files are supplied. Three use generic filenames so source type must be determined from their contents rather than the filename.",
                    (
                        table(
                            ("ID", "File", "Apparent source"),
                            (
                                ("D02", "02_job_advertisement.pdf", "Recruitment record"),
                                ("D03", "03_recruiter_messages.pdf", "Communication"),
                                ("D04", "04_offer_letter_and_contract.pdf", "Recruitment record"),
                                ("D05-D06", "Identity, travel, movement", "Travel records"),
                                ("D07-D10", "Ledgers, tasks, messages", "Operational and communications"),
                                ("D11-D14", "Police, intake, support, hearing", "Review and proceeding records"),
                                ("D15-D17", "Generic filenames", "Type must be reviewed from content"),
                            ),
                            (22, 77, 64),
                        ),
                        note(
                            "Coverage limitation",
                            "The index records supplied files only. It does not prove that the packet is complete, authentic, or sufficient for a legal decision.",
                            "neutral",
                        ),
                    ),
                ),
            ),
        ),
        DocumentSpec(
            "D02",
            "02_job_advertisement.pdf",
            "Customer Support Opportunity",
            "Recruitment record",
            "fictional recruitment publication",
            (
                PageSpec(
                    "Advertisement posted 8 January 2025",
                    "Meridian Pathways Ltd. advertises an ordinary customer-support role with represented pay, housing, and travel support.",
                    (
                        table(
                            ("Role", "Location", "Start", "Reference"),
                            (
                                ("Customer Support Associate", "Port Sable, J-02", "25 January 2025", "MP-ROLE-118"),
                            ),
                            (48, 43, 39, 33),
                        ),
                        section(
                            "Represented opportunity",
                            "The job advertisement presents a job offer from HelioBridge Customer Support for ordinary client-service duties. It promises a monthly salary of 2,400 J-credits, shared housing, travel arranged by the recruiter, and voluntary resignation with seven days notice.",
                        ),
                        bullets(
                            "Advertised duties",
                            (
                                "Respond to customer questions using approved service scripts.",
                                "Maintain ordinary daytime hours with one rest day each week.",
                                "Receive written training before beginning work.",
                            ),
                        ),
                        note(
                            "Source limitation",
                            "An advertisement records represented terms. It does not establish what later occurred or whether the publisher had authority to make these representations.",
                        ),
                    ),
                ),
                PageSpec(
                    "Applicant instructions",
                    "The application page requests personal details and describes recruiter-managed travel.",
                    (
                        section(
                            "Application process",
                            "Applicants are directed to recruiter Orin Kade. The application asks for a passport copy, phone number, and email. The advertisement says identity documents will be used only for travel and permit processing.",
                        ),
                        table(
                            ("Contact", "Value"),
                            (
                                ("Recruiter", "Orin Kade"),
                                ("Recruitment organization", "Meridian Pathways Ltd."),
                                ("Role reference", "MP-ROLE-118"),
                            ),
                            (55, 108),
                        ),
                        note(
                            "No conclusion",
                            "The source contains recruitment language and promised terms. It does not by itself prove deception, coercion, or exploitation.",
                            "positive",
                        ),
                    ),
                ),
            ),
        ),
        DocumentSpec(
            "D03",
            "03_recruiter_messages.pdf",
            "Recruiter Message Export",
            "Communication",
            "sender identity unverified",
            (
                PageSpec(
                    "Initial contact",
                    "Message export attributed to Orin Kade and Nila Verin. Sender identity and export completeness are unverified.",
                    (
                        messages(
                            (
                                ("10 January 2025 09:14", "Orin Kade", "I am the recruiter for role MP-ROLE-118. Your customer-support application was selected."),
                                ("10 January 2025 09:22", "Nila Verin", "Please confirm the salary, hours, and whether I can leave the position."),
                                ("10 January 2025 09:31", "Orin Kade", "Salary is 2,400 J-credits monthly. Travel and shared housing are arranged. You can leave with seven days notice."),
                                ("11 January 2025 16:08", "Orin Kade", "Send the passport copy to the permit team. The original remains yours."),
                            )
                        ),
                        note(
                            "Evidence nature",
                            "These messages document representations attributed to an unverified account. They do not establish the sender's identity or truth of the statements.",
                        ),
                    ),
                ),
                PageSpec(
                    "Changed travel and document instructions",
                    "Later messages describe changed transfer instructions, passport custody, and a travel debt.",
                    (
                        messages(
                            (
                                ("21 January 2025 18:40", "Orin Kade", "Travel was arranged under booking BK-J2-4481. After arrival, driver V-204 will take you to Cedar House."),
                                ("22 January 2025 07:10", "Orin Kade", "Do not discuss the onward journey at the airport. The permit team will retain your passport for processing."),
                                ("23 January 2025 20:05", "Nila Verin", "This was not in the offer. When will the passport be returned?"),
                                ("23 January 2025 20:12", "Orin Kade", "Travel and housing created a debt of 3,600 J-credits. Leaving before the debt is cleared will have consequences."),
                            )
                        ),
                        note(
                            "Review question",
                            "What source, if any, clarifies who controlled the passport, whether the debt was agreed, and whether departure was genuinely available?",
                            "warning",
                        ),
                    ),
                ),
                PageSpec(
                    "Pressure after arrival",
                    "The final page contains threat-like language and changed work instructions.",
                    (
                        messages(
                            (
                                ("26 January 2025 06:35", "Nila Verin", "I want my passport back and I want to leave."),
                                ("26 January 2025 06:42", "Orin Kade", "Supervisor Daro Venn has the documents. Do not cause problems for your family by refusing the assigned work."),
                                ("27 January 2025 05:55", "Orin Kade", "The customer-support description no longer applies. Follow the supervisor's scripts until the debt is paid."),
                            )
                        ),
                        note(
                            "Unresolved provenance",
                            "Account ownership, message integrity, and whether any messages are missing remain unknown.",
                            "danger",
                        ),
                    ),
                ),
            ),
        ),
        DocumentSpec(
            "D04",
            "04_offer_letter_and_contract.pdf",
            "Offer Letter and Employment Terms",
            "Recruitment record",
            "fictional signed copy; signature authenticity unverified",
            (
                PageSpec(
                    "Offer dated 18 January 2025",
                    "HelioBridge Customer Support offers an ordinary service role under reference MP-ROLE-118.",
                    (
                        table(
                            ("Employee", "Employer", "Role", "Start"),
                            (
                                ("Nila Verin", "HelioBridge Customer Support", "Customer Support Associate", "25 January 2025"),
                            ),
                            (35, 51, 45, 32),
                        ),
                        section(
                            "Compensation",
                            "The represented monthly salary is 2,400 J-credits. Housing and travel support are described as employer-paid benefits. No recruitment debt, wage deduction, or passport custody term appears in this offer.",
                        ),
                        section(
                            "Work schedule",
                            "The offer describes eight-hour daytime shifts, one rest day per week, and paid training.",
                        ),
                    ),
                ),
                PageSpec(
                    "Voluntary employment terms",
                    "The contract states that employment can be ended with notice and that identity documents remain with the employee.",
                    (
                        bullets(
                            "Represented rights",
                            (
                                "The employee may resign with seven days written notice.",
                                "The employee retains possession of the original passport and personal phone.",
                                "No penalty applies merely because employment ends.",
                                "Accommodation is optional and is not tied to continued work.",
                            ),
                        ),
                        note(
                            "Potential comparison",
                            "These represented terms can be compared with later messages and records. The comparison does not determine which source is accurate.",
                        ),
                    ),
                ),
                PageSpec(
                    "Acknowledgement",
                    "The page contains a fictional signature block and contact details solely to exercise masking and source review.",
                    (
                        table(
                            ("Field", "Value"),
                            (
                                ("Employee", "Nila Verin"),
                                ("Date signed", "18 January 2025"),
                                ("Email", "nila.verin@example.test"),
                                ("Phone", "+1 202-555-0147"),
                                ("Recruiter", "Orin Kade"),
                            ),
                            (50, 113),
                        ),
                        note(
                            "Signature limitation",
                            "The signature is a synthetic mark. The packet provides no forensic signature verification.",
                            "neutral",
                        ),
                    ),
                ),
            ),
        ),
        DocumentSpec(
            "D05",
            "05_identity_and_travel_extract.pdf",
            "Identity and Travel Extract",
            "Travel record",
            "fictional administrative extract",
            (
                PageSpec(
                    "Identity fields",
                    "A fictional identity extract contains supported identifier patterns for the masking demonstration.",
                    (
                        table(
                            ("Field", "Value"),
                            (
                                ("Name", "Nila Verin"),
                                ("Alias", "N. Vale"),
                                ("Date of birth", "1998-04-17"),
                                ("Passport number", "XN0007421"),
                                ("Email", "nila.verin@example.test"),
                                ("Phone", "+1 202-555-0147"),
                                ("Address", "42 Example Lane, Demo City"),
                            ),
                            (54, 109),
                        ),
                        note(
                            "Privacy review required",
                            "These values are deliberately fictional but formatted to exercise identifier detection and masking. The original PDF remains unmasked.",
                            "warning",
                        ),
                    ),
                ),
                PageSpec(
                    "Travel itinerary",
                    "Ticket record BK-J2-4481 documents travel from J-01 to J-02.",
                    (
                        table(
                            ("Booking", "Departure", "Arrival", "Passenger"),
                            (
                                ("BK-J2-4481", "21 January 2025, J-01", "22 January 2025, Port Sable J-02", "Nila Verin"),
                            ),
                            (35, 43, 53, 32),
                        ),
                        section(
                            "Travel note",
                            "The record states that travel was arranged by Meridian Pathways Ltd. and that a vehicle transfer would meet the passenger after arrival.",
                        ),
                        note(
                            "Scope",
                            "The ticket documents booked movement. It does not establish who accompanied the passenger, whether travel was voluntary, or where the passenger went after arrival.",
                        ),
                    ),
                ),
            ),
        ),
        DocumentSpec(
            "D06",
            "06_accommodation_and_movement_log.pdf",
            "Accommodation and Movement Log",
            "Travel record",
            "unverified internal log",
            (
                PageSpec(
                    "Arrival and transfer",
                    "Internal log entries refer to booking BK-J2-4481, vehicle V-204, and Cedar House.",
                    (
                        table(
                            ("Date", "Time", "Entry", "Reference"),
                            (
                                ("22 January 2025", "18:10", "Passenger collected at Port Sable terminal", "V-204"),
                                ("23 January 2025", "00:35", "Arrival recorded at Cedar House", "CH-118"),
                                ("23 January 2025", "06:10", "Transfer to HelioBridge worksite", "V-204"),
                            ),
                            (34, 22, 75, 32),
                        ),
                        section(
                            "Accommodation assignment",
                            "Cedar House room CH-3B is listed as shared housing arranged by Meridian Pathways Ltd. The log does not contain a resident signature.",
                        ),
                    ),
                ),
                PageSpec(
                    "Exit and movement entries",
                    "The log contains restricted-exit language but does not identify who authored each entry.",
                    (
                        table(
                            ("Date", "Entry"),
                            (
                                ("24 January 2025", "Resident movement requires supervisor approval until permit processing is complete."),
                                ("26 January 2025", "Exit request recorded as denied pending debt review."),
                                ("20 March 2025", "Resident absent after external inspection; destination unknown."),
                            ),
                            (42, 121),
                        ),
                        note(
                            "Unverified authorship",
                            "The record may support questions about movement restrictions. It does not prove the identity, authority, or accuracy of its author.",
                            "warning",
                        ),
                    ),
                ),
            ),
        ),
        DocumentSpec(
            "D07",
            "07_debt_and_wage_ledger.pdf",
            "Debt and Wage Ledger",
            "Operational or financial record",
            "unverified spreadsheet export",
            (
                PageSpec(
                    "Ledger period 25 January to 28 February 2025",
                    "The ledger records travel debt, housing charges, wage credits, and deductions.",
                    (
                        table(
                            ("Date", "Description", "Debit", "Credit", "Balance"),
                            (
                                ("25 January 2025", "Opening travel debt", "3,600", "-", "3,600"),
                                ("31 January 2025", "Housing deduction", "450", "-", "4,050"),
                                ("14 February 2025", "Wage credit", "-", "1,200", "2,850"),
                                ("14 February 2025", "Quota penalty", "900", "-", "3,750"),
                                ("28 February 2025", "Wage transfer noted", "-", "1,200", "2,550"),
                            ),
                            (30, 61, 23, 23, 26),
                        ),
                        note(
                            "Review limitation",
                            "A ledger entry does not prove that wages were accessible to Nila or that a debt or deduction was valid.",
                        ),
                    ),
                ),
                PageSpec(
                    "Ledger period 1 to 18 March 2025",
                    "Later entries record penalties and withheld payment during the same period as assigned tasks.",
                    (
                        table(
                            ("Date", "Description", "Debit", "Credit", "Balance"),
                            (
                                ("3 March 2025", "Phone access charge", "120", "-", "2,670"),
                                ("10 March 2025", "Missed quota penalty", "750", "-", "3,420"),
                                ("14 March 2025", "Transfer-task penalty", "600", "-", "4,020"),
                                ("18 March 2025", "Wages withheld pending debt clearance", "-", "-", "4,020"),
                            ),
                            (30, 77, 20, 18, 18),
                        ),
                        section(
                            "Period statement",
                            "Between 25 January 2025 and 18 March 2025, the ledger records pay deductions, debt pressure, and wages withheld pending debt clearance.",
                        ),
                        note(
                            "Provenance unknown",
                            "The export has no verified author, system signature, or complete audit trail.",
                            "danger",
                        ),
                    ),
                ),
            ),
        ),
        DocumentSpec(
            "D08",
            "08_synthetic_bank_statement.pdf",
            "Synthetic Bank Statement",
            "Operational or financial record",
            "fictional financial statement",
            (
                PageSpec(
                    "Account summary",
                    "This fictional statement contains a labelled account number for masking and a limited set of transactions.",
                    (
                        table(
                            ("Account holder", "Account number", "Statement period"),
                            (
                                ("Nila Verin", "0000 0000 0000 7421", "1 February to 31 March 2025"),
                            ),
                            (51, 60, 52),
                        ),
                        table(
                            ("Date", "Description", "Amount", "Status"),
                            (
                                ("28 February 2025", "HELIOBRIDGE WAGE REF HB-228", "+1,200", "Received"),
                                ("28 February 2025", "MERIDIAN RECOVERY REF MR-228", "-1,200", "Same-day debit"),
                                ("14 March 2025", "TRANSFER REF TR-0314", "-600", "Processed"),
                            ),
                            (35, 73, 27, 28),
                        ),
                        note(
                            "Technical record only",
                            "The statement records transactions. It does not determine who controlled the account or whether Nila could access the credited funds.",
                        ),
                    ),
                ),
                PageSpec(
                    "Transaction annotations",
                    "Annotations connect transaction references to other packet records without deciding why the transactions occurred.",
                    (
                        bullets(
                            "Cross-source references",
                            (
                                "HB-228 corresponds to the wage-transfer entry in D07.",
                                "MR-228 is labelled debt recovery but no signed authorization is supplied.",
                                "TR-0314 appears in the task log and supervisor messages dated 14 March 2025.",
                            ),
                        ),
                        note(
                            "Unresolved question",
                            "What source, if any, establishes who initiated TR-0314 and whether Nila had a genuine choice?",
                            "warning",
                        ),
                    ),
                ),
            ),
        ),
        DocumentSpec(
            "D09",
            "09_task_and_penalty_log.pdf",
            "Task and Penalty Log",
            "Operational or financial record",
            "unverified internal export",
            (
                PageSpec(
                    "Assigned activity",
                    "The log records account messaging tasks and quota requirements beginning 25 January 2025.",
                    (
                        table(
                            ("Date", "Task ID", "Assigned activity", "Supervisor"),
                            (
                                ("25 January 2025", "TASK-101", "Send ten account-verification messages", "Daro Venn"),
                                ("2 February 2025", "TASK-118", "Open three payment profiles", "Daro Venn"),
                                ("10 March 2025", "TASK-207", "Message transfer instructions to five contacts", "Daro Venn"),
                                ("14 March 2025", "TASK-214", "Complete transfer TR-0314", "Daro Venn"),
                            ),
                            (32, 27, 72, 32),
                        ),
                        note(
                            "Source meaning",
                            "The log documents assigned activity if authentic. It does not prove who performed a specific task or whether the listed supervisor authored the entry.",
                        ),
                    ),
                ),
                PageSpec(
                    "Quota and penalty entries",
                    "Entries describe consequences for refusing or missing assigned tasks.",
                    (
                        table(
                            ("Date", "Entry", "Recorded consequence"),
                            (
                                ("10 March 2025", "TASK-207 shortfall", "750 J-credit debt increase"),
                                ("14 March 2025", "TASK-214 initially refused", "600 J-credit penalty and phone restriction"),
                                ("18 March 2025", "Weekly quota missed", "Wages withheld"),
                            ),
                            (35, 56, 72),
                        ),
                        section(
                            "Compelled-conduct phrase",
                            "The entry for TASK-214 states: Supervisor ordered N. Vale to complete transfer TR-0314 after the worker initially refused.",
                        ),
                        note(
                            "No offence conclusion",
                            "This record may be relevant to review of alleged compelled conduct. It does not establish guilt, coercion, or the legal effect of any relationship.",
                            "warning",
                        ),
                    ),
                ),
            ),
        ),
        DocumentSpec(
            "D10",
            "10_supervisor_messages.pdf",
            "Supervisor Message Export",
            "Communication",
            "sender identity unverified",
            (
                PageSpec(
                    "Work instructions",
                    "Messages attributed to supervisor Daro Venn describe changed duties and restricted movement.",
                    (
                        messages(
                            (
                                ("25 January 2025 05:45", "Daro Venn", "You are required to use the verification scripts assigned in TASK-101."),
                                ("25 January 2025 06:02", "Nila Verin", "This is not the customer-support role in my contract."),
                                ("25 January 2025 06:08", "Daro Venn", "You are not allowed to leave Cedar House or the worksite without approval while the debt remains."),
                            )
                        ),
                        note(
                            "Provenance",
                            "The export attributes messages to accounts. It does not independently verify account ownership.",
                        ),
                    ),
                ),
                PageSpec(
                    "Transfer instruction",
                    "Messages on 14 March 2025 refer to task TASK-214 and bank reference TR-0314.",
                    (
                        messages(
                            (
                                ("14 March 2025 11:20", "Daro Venn", "Complete transfer TR-0314 now. You are required to use the account already open."),
                                ("14 March 2025 11:24", "Nila Verin", "I do not want to make this transfer."),
                                ("14 March 2025 11:27", "Daro Venn", "Refusal adds another penalty. Your passport and phone remain withheld until the debt is cleared."),
                                ("14 March 2025 11:35", "Daro Venn", "Send the confirmation before the end of the shift."),
                            )
                        ),
                        note(
                            "Review question",
                            "What relationship, if any, does the source describe between the transfer and the stated pressure?",
                            "warning",
                        ),
                    ),
                ),
                PageSpec(
                    "Threat and retaliation language",
                    "Later messages contain safety-relevant language attributed to the supervisor.",
                    (
                        messages(
                            (
                                ("18 March 2025 21:05", "Nila Verin", "I am asking again to leave and have my documents returned."),
                                ("18 March 2025 21:11", "Daro Venn", "If you contact police, there will be retaliation against you and problems for your family."),
                                ("19 March 2025 04:20", "Daro Venn", "Report to the worksite. Wages are withheld until the quota and debt are cleared."),
                            )
                        ),
                        note(
                            "Safety boundary",
                            "Threat-like text requires prompt human review. It does not establish who sent it, whether it was acted upon, or the current level of danger.",
                            "danger",
                        ),
                    ),
                ),
            ),
        ),
        DocumentSpec(
            "D11",
            "11_police_incident_record.pdf",
            "Fictional Police Incident Record",
            "Alleged-offence and procedural record",
            "fictional procedural record",
            (
                PageSpec(
                    "Incident recorded 20 March 2025",
                    "This fictional record documents an allegation and detention. It does not establish guilt.",
                    (
                        table(
                            ("Incident", "Person named", "Date / time", "Location"),
                            (
                                ("J2-INC-320", "N. Vale", "20 March 2025, 14:25", "Port Sable"),
                            ),
                            (38, 38, 47, 40),
                        ),
                        section(
                            "Allegation",
                            "Police recorded an allegation that account-verification messages and transfer TR-0314 were connected to deceptive communications. The record states that police detained N. Vale pending interview.",
                        ),
                        note(
                            "Procedural fact only",
                            "An allegation and detention are not proof of an offence. The record makes no determination about trafficking, compulsion, credibility, or legal eligibility.",
                            "warning",
                        ),
                    ),
                ),
                PageSpec(
                    "Property and interview status",
                    "The record lists recovered items and leaves interpretation and legal-support fields incomplete.",
                    (
                        table(
                            ("Field", "Recorded value"),
                            (
                                ("Recovered phone", "Device DEV-441, ownership not determined"),
                                ("Passport", "Not recorded among recovered property"),
                                ("Interpreter", "Not requested / language need not assessed"),
                                ("Legal aid", "Referral pending"),
                                ("Interview completion", "Deferred"),
                            ),
                            (53, 110),
                        ),
                        note(
                            "Gap",
                            "The record does not show whether Nila understood the process, had legal advice, or had a safe opportunity to describe the reported pressure.",
                            "danger",
                        ),
                    ),
                ),
            ),
        ),
        DocumentSpec(
            "D12",
            "12_practitioner_intake_note.pdf",
            "Practitioner Intake Note",
            "Practitioner note of a reported account",
            "fictional practitioner-authored note of reported information",
            (
                PageSpec(
                    "Intake dated 21 March 2025",
                    "The following statements are attributed to Nila Verin and are not independently verified by this note.",
                    (
                        table(
                            ("Field", "Value"),
                            (
                                ("Client name", "Nila Verin"),
                                ("Alias used in proceeding", "N. Vale"),
                                ("Date of birth", "17 April 1998"),
                                ("Email", "nila.verin@example.test"),
                                ("Phone", "+1 202-555-0147"),
                                ("Address before travel", "42 Example Lane, Demo City"),
                            ),
                            (55, 108),
                        ),
                        note(
                            "Attribution",
                            "Reported by Nila during a fictional training interview. No credibility determination is made.",
                            "neutral",
                        ),
                    ),
                ),
                PageSpec(
                    "Reported recruitment, movement, and control",
                    "The note preserves approximate memory and distinguishes it from administrative records.",
                    (
                        section(
                            "Reported account",
                            "Nila reported accepting what appeared to be an ordinary customer-support job. She remembers reaching the worksite around 24 January 2025 after travel and shared housing were arranged by the recruiter.",
                        ),
                        section(
                            "Documents and movement",
                            "Nila reported that supervisor Daro Venn retained her passport and phone, that she could not leave Cedar House without approval, and that the passport was never returned. She reported debt pressure and threats involving her family.",
                        ),
                        note(
                            "Clarification needed",
                            "D06 records Cedar House arrival on 23 January 2025, while this note records approximate worksite arrival around 24 January 2025. These may describe different locations or events.",
                            "warning",
                        ),
                    ),
                ),
                PageSpec(
                    "Reported work, alleged conduct, and current needs",
                    "The note records a reported connection between assigned tasks, pressure, and the later allegation.",
                    (
                        section(
                            "Reported assigned activity",
                            "Nila reported being forced to work excessive hours, working without pay she could access, and being ordered to send account-verification messages. She reported that the supervisor made her transfer funds on 14 March 2025 after she refused.",
                        ),
                        section(
                            "Current safety and procedure",
                            "Nila reported feeling unsafe because of retaliation threats. Immediate housing, legal aid, safe contact, and an interpreter for the hearing require confirmation.",
                        ),
                        note(
                            "Practitioner boundary",
                            "This note records a reported account and urgent questions. It does not establish that the reported events occurred or determine any legal consequence.",
                            "danger",
                        ),
                    ),
                ),
            ),
        ),
        DocumentSpec(
            "D13",
            "13_support_and_health_note.pdf",
            "Support and Health Coordination Note",
            "Support-provider note",
            "fictional support-provider record",
            (
                PageSpec(
                    "Assessment dated 22 March 2025",
                    "A fictional support provider records immediate practical questions without making clinical or legal findings.",
                    (
                        table(
                            ("Need", "Current status", "Action"),
                            (
                                ("Safe housing", "Emergency shelter requested", "Availability unverified"),
                                ("Safe contact", "Phone may be monitored", "Confirm a safe method"),
                                ("Medical", "General medical appointment requested", "No diagnosis recorded"),
                                ("Legal aid", "Referral requested", "Counsel not confirmed"),
                            ),
                            (42, 58, 63),
                        ),
                        note(
                            "No provider contact claim",
                            "The note records requested coordination only. It does not claim that a provider accepted a referral or that services are available.",
                        ),
                    ),
                ),
                PageSpec(
                    "Language and hearing support",
                    "The hearing is time-sensitive, but interpretation support remains unconfirmed.",
                    (
                        section(
                            "Interpretation",
                            "The client may need an interpreter for the hearing scheduled on 2 April 2025. Spoken-language preference must be confirmed directly. No interpreter booking confirmation is present.",
                        ),
                        section(
                            "Urgency",
                            "The upcoming court date, safe-contact concern, and emergency shelter request require prompt practitioner review.",
                        ),
                        note(
                            "Unknown date",
                            "The date on which interpretation will be confirmed is unknown.",
                            "warning",
                        ),
                    ),
                ),
            ),
        ),
        DocumentSpec(
            "D14",
            "14_hearing_and_charge_summary.pdf",
            "Fictional Hearing and Charge Summary",
            "Alleged-offence and procedural record",
            "fictional court summary",
            (
                PageSpec(
                    "Proceeding summary",
                    "This fictional summary records allegations and a hearing schedule, not findings.",
                    (
                        table(
                            ("Proceeding", "Person", "Hearing", "Status"),
                            (
                                ("J-02 v. N. Vale", "N. Vale", "2 April 2025, 09:30", "Initial hearing"),
                            ),
                            (50, 34, 47, 32),
                        ),
                        section(
                            "Alleged conduct",
                            "The proceeding alleges deceptive account communications between 25 January 2025 and 18 March 2025, including transfer TR-0314 on 14 March 2025. No guilt determination has been made.",
                        ),
                        note(
                            "Review boundary",
                            "The date overlap with work, debt, movement, and supervisor records is a review question. It is not a legal conclusion about causation or non-punishment.",
                            "warning",
                        ),
                    ),
                ),
                PageSpec(
                    "Procedural support fields",
                    "Several safeguards remain pending or unknown.",
                    (
                        table(
                            ("Field", "Status"),
                            (
                                ("Legal representative", "Legal aid referral pending"),
                                ("Interpreter", "Unknown - no booking confirmation"),
                                ("Document disclosure", "Partial packet supplied"),
                                ("Safe contact", "Method not confirmed"),
                                ("Next date", "2 April 2025"),
                            ),
                            (57, 106),
                        ),
                        note(
                            "Qualified review required",
                            "Local law, procedural rights, admissibility, and any legal relevance must be verified by a qualified practitioner in the fictional jurisdiction.",
                            "neutral",
                        ),
                    ),
                ),
            ),
        ),
        DocumentSpec(
            "D15",
            "scan_001.pdf",
            "Property Custody Record",
            "Other",
            "unsigned and unverified",
            (
                PageSpec(
                    "Generic filename source",
                    "The filename does not identify this record. Its visible contents resemble an unsigned property-custody form.",
                    (
                        table(
                            ("Property", "Identifier", "Received", "Recorded disposition"),
                            (
                                ("Passport", "Passport number XN0007421", "23 January 2025", "Returned 26 January 2025"),
                                ("Mobile phone", "Device DEV-441", "23 January 2025", "No disposition recorded"),
                            ),
                            (38, 52, 36, 37),
                        ),
                        note(
                            "Material conflict",
                            "The form states that the passport was returned, while D12 records Nila's later report that it was never returned. This form has no resident signature, author name, or verification mark.",
                            "danger",
                        ),
                    ),
                ),
            ),
        ),
        DocumentSpec(
            "D16",
            "attachment_02.pdf",
            "Vehicle Transfer Sheet",
            "Other",
            "unverified operational attachment",
            (
                PageSpec(
                    "Generic filename source",
                    "The content resembles a vehicle-transfer sheet linked to booking BK-J2-4481.",
                    (
                        table(
                            ("Vehicle", "Passenger", "Pickup", "Destination", "Arrival"),
                            (
                                ("V-204", "Nila Verin", "Port Sable terminal", "Cedar House CH-3B", "23 January 2025 00:35"),
                            ),
                            (25, 34, 40, 40, 34),
                        ),
                        section(
                            "Driver note",
                            "Travel was arranged by Meridian Pathways Ltd. Driver instruction: deliver passenger to shared housing and transfer documents to the permit desk.",
                        ),
                        note(
                            "Classification and provenance",
                            "The contents suggest a travel or transport record. The author, completeness, and meaning of 'transfer documents' remain unverified.",
                            "warning",
                        ),
                    ),
                ),
            ),
        ),
        DocumentSpec(
            "D17",
            "document_final.pdf",
            "Interpretation Request Response",
            "Other",
            "unverified administrative response",
            (
                PageSpec(
                    "Generic filename source",
                    "The content resembles an administrative response to an interpretation request.",
                    (
                        table(
                            ("Request reference", "Hearing", "Requested support", "Response"),
                            (
                                ("INT-J2-041", "2 April 2025", "Interpreter", "Request received; provider and language not confirmed"),
                            ),
                            (36, 36, 43, 48),
                        ),
                        section(
                            "Response text",
                            "No interpreter has been assigned. Spoken-language preference remains blank. Confirmation date is unknown. Contact the authorized practitioner before relying on this request.",
                        ),
                        note(
                            "Gap preserved",
                            "A request is not a confirmed service. The packet contains no evidence that interpretation support will be available at the hearing.",
                            "warning",
                        ),
                    ),
                ),
            ),
        ),
    )


def write_manifest(documents: tuple[DocumentSpec, ...], output_dir: Path):
    manifest = {
        "packetReference": PACKET_REFERENCE,
        "synthetic": True,
        "disclaimer": SYNTHETIC_LABEL,
        "documentCount": len(documents),
        "documents": [
            {
                "id": document.document_id,
                "filename": document.filename,
                "displayTitle": document.title,
                "sourceType": document.source_type,
                "provenance": document.provenance,
                "expectedPageCount": len(document.pages),
            }
            for document in documents
        ],
    }
    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )


def main():
    documents = specs()
    for output_dir in (OUTPUT_DIR, PUBLIC_DIR):
        output_dir.mkdir(parents=True, exist_ok=True)
        for document in documents:
            build_document(document, output_dir)
        write_manifest(documents, output_dir)
        print(f"Generated {len(documents)} PDFs in {output_dir}")


if __name__ == "__main__":
    main()
