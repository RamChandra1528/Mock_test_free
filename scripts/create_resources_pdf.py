from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "ssc-je-scientific-assistant-preparation-pack.pdf"
PUBLIC_COPY = ROOT / "frontend" / "public" / "resources" / OUTPUT.name

FOREST = colors.HexColor("#173F35")
MINT = colors.HexColor("#EAF6EF")
LIME = colors.HexColor("#D4F17A")
INK = colors.HexColor("#17241F")
MUTED = colors.HexColor("#64746C")
LINE = colors.HexColor("#DCE6DF")


def text_style(name, **kwargs):
    return ParagraphStyle(name, parent=getSampleStyleSheet()["BodyText"], **kwargs)


TITLE = text_style(
    "Title", fontName="Helvetica-Bold", fontSize=25, leading=30, textColor=FOREST,
    alignment=TA_CENTER, spaceAfter=7,
)
SUBTITLE = text_style(
    "Subtitle", fontName="Helvetica", fontSize=10.5, leading=15, textColor=MUTED,
    alignment=TA_CENTER,
)
H1 = text_style(
    "H1", fontName="Helvetica-Bold", fontSize=17, leading=22, textColor=FOREST,
    spaceBefore=2, spaceAfter=8,
)
H2 = text_style(
    "H2", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=FOREST,
    spaceAfter=4,
)
BODY = text_style(
    "Body", fontName="Helvetica", fontSize=9.3, leading=14, textColor=INK,
)
SMALL = text_style(
    "Small", fontName="Helvetica", fontSize=8.2, leading=11.5, textColor=MUTED,
)
TAG = text_style(
    "Tag", fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=FOREST,
)
TABLE_HEAD = text_style(
    "TableHead", fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=colors.white,
)


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(18 * mm, 15 * mm, A4[0] - 18 * mm, 15 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 9.5 * mm, "MockMaster original preparation material")
    canvas.drawRightString(A4[0] - 18 * mm, 9.5 * mm, f"Page {doc.page}")
    canvas.restoreState()


def card(title, body):
    return Table(
        [[Paragraph(title, H2)], [Paragraph(body, BODY)]],
        colWidths=[83 * mm],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.white),
            ("BOX", (0, 0), (-1, -1), 0.75, LINE),
            ("TOPPADDING", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ]),
    )


def check_row(label, details):
    return [
        Paragraph("<b>CHECK</b>", TAG),
        Paragraph(f"<b>{label}</b><br/>{details}", BODY),
    ]


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_COPY.parent.mkdir(parents=True, exist_ok=True)
    document = SimpleDocTemplate(
        str(OUTPUT), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm,
        topMargin=16 * mm, bottomMargin=22 * mm,
    )
    story = []
    story.append(Spacer(1, 13 * mm))
    story.append(Paragraph("SSC JE &amp; SCIENTIFIC ASSISTANT", TITLE))
    story.append(Paragraph("Preparation Pack: syllabus map, weekly plan and revision tracker", SUBTITLE))
    story.append(Spacer(1, 11 * mm))
    intro = Table([[Paragraph("USE THIS PACK", H2), Paragraph(
        "Turn the official notification into a realistic study routine. Tick items only after you can solve questions without notes. The latest SSC notification always overrides this guide.",
        BODY,
    )]], colWidths=[38 * mm, 132 * mm], style=TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), LIME),
        ("BACKGROUND", (1, 0), (1, 0), MINT),
        ("BOX", (0, 0), (-1, -1), 0.75, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(intro)
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph("1. Choose your exam lane", H1))
    lanes = Table([[
        card("SSC JE", "For Civil, Electrical or Mechanical candidates. Prioritise your General Engineering subject, then maintain General Awareness and Reasoning."),
        card("Scientific Assistant (IMD)", "Balance the general sections with Physics, Mathematics, Electronics or Computer Science topics specified for your chosen post."),
    ]], colWidths=[85 * mm, 85 * mm], style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(lanes)
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph("2. Your non-negotiable weekly routine", H1))
    routine = [
        [Paragraph("DAY", TAG), Paragraph("FOCUS", TAG), Paragraph("OUTPUT", TAG)],
        ["Mon-Thu", "One core topic + timed practice", "25-40 questions and an error note"],
        ["Friday", "Formula / concept revision", "One-page revision sheet"],
        ["Saturday", "Sectional test", "Accuracy, time and weak-topic log"],
        ["Sunday", "Full mock or backlog recovery", "Review every wrong / guessed answer"],
    ]
    routine = [[Paragraph(str(value), BODY) if row else value for value in row] for row in routine]
    routine[0] = [Paragraph("DAY", TABLE_HEAD), Paragraph("FOCUS", TABLE_HEAD), Paragraph("OUTPUT", TABLE_HEAD)]
    story.append(Table(routine, colWidths=[28 * mm, 70 * mm, 72 * mm], style=TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), FOREST),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ])))

    story.append(PageBreak())
    story.append(Paragraph("Syllabus & practice checklist", H1))
    story.append(Paragraph("Use the most recent SSC notification for final topic coverage and exam pattern. This list is a study organiser, not an official notice.", SMALL))
    story.append(Spacer(1, 5 * mm))
    checks = [
        check_row("SSC JE: General Engineering", "Break your branch syllabus into modules. Finish concepts, solved examples, previous-year questions and a short formula sheet for every module."),
        check_row("SSC JE: General Ability", "Practise reasoning and general awareness in short, timed sessions so they never take time away from engineering."),
        check_row("Scientific Assistant: General sections", "Reasoning, quant, English, general awareness, general science and computer basics should become high-accuracy scoring areas."),
        check_row("Scientific Assistant: Domain subject", "Prioritise the Physics / Mathematics / Electronics / Computer Science topics listed in the relevant notification for your post."),
        check_row("Previous-year papers", "Solve them in exam conditions. Mark repeated chapters, not just repeated questions."),
        check_row("Mock-test review", "Tag each error as concept, calculation, reading or time. Reattempt those questions 48 hours later."),
    ]
    story.append(Table(checks, colWidths=[27 * mm, 143 * mm], style=TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("BACKGROUND", (0, 0), (0, -1), MINT),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ])))
    story.append(Spacer(1, 9 * mm))
    story.append(Paragraph("Book shelf - use legal editions", H1))
    shelf = [
        [Paragraph("REFERENCE", TABLE_HEAD), Paragraph("BEST USED FOR", TABLE_HEAD)],
        [Paragraph("SSC JE Previous Years' Solved Papers", BODY), Paragraph("Paper pattern, topic frequency and timed practice", BODY)],
        [Paragraph("Objective General English - S. P. Bakshi", BODY), Paragraph("English practice for Scientific Assistant CBT", BODY)],
        [Paragraph("R. S. Aggarwal Reasoning", BODY), Paragraph("Reasoning fundamentals and speed drills", BODY)],
        [Paragraph("Lucent's General Knowledge", BODY), Paragraph("Static GK and science revision", BODY)],
    ]
    story.append(Table(shelf, colWidths=[83 * mm, 87 * mm], style=TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), FOREST),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ])))

    story.append(PageBreak())
    story.append(Paragraph("Revision & mock-test tracker", H1))
    story.append(Paragraph("Keep this page next to your desk. A smaller plan completed consistently beats an overfilled timetable.", SMALL))
    story.append(Spacer(1, 5 * mm))
    tracker = [[Paragraph(label, TABLE_HEAD) for label in ["WEEK", "TOPICS", "QUESTIONS", "MOCK / SCORE", "REVISION DATE"]]]
    tracker += [["", "", "", "", ""] for _ in range(6)]
    story.append(Table(tracker, colWidths=[19 * mm, 59 * mm, 28 * mm, 35 * mm, 29 * mm], rowHeights=[11 * mm] + [14 * mm] * 6, style=TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), FOREST),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ])))
    story.append(Spacer(1, 9 * mm))
    story.append(Paragraph("Mock-test review template", H1))
    errors = [[Paragraph(label, TABLE_HEAD) for label in ["QUESTION / TOPIC", "ERROR TYPE", "FIX BEFORE NEXT TEST"]]]
    errors += [["", "", ""] for _ in range(4)]
    story.append(Table(errors, colWidths=[65 * mm, 39 * mm, 65 * mm], rowHeights=[11 * mm] + [14 * mm] * 4, style=TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), FOREST),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ])))
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("Final reminder", H1))
    story.append(Paragraph("Verify the current notification, eligibility, syllabus, dates and result documents through the official SSC website before making important preparation decisions.", BODY))

    document.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    PUBLIC_COPY.write_bytes(OUTPUT.read_bytes())


if __name__ == "__main__":
    build()
