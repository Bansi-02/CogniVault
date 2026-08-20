import os
import sys
import subprocess

# Ensure reportlab is installed for PDF generation
try:
    import reportlab
except ImportError:
    print("Installing reportlab library for PDF generation...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
    except Exception as e:
        print(f"Failed to install reportlab via pip: {e}. Attempting direct pip install...")
        subprocess.check_call(["pip", "install", "reportlab"])

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_msa_pdf(filepath):
    print(f"Generating Master Service Agreement PDF: {filepath}")
    doc = SimpleDocTemplate(filepath, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        spaceAfter=15,
        alignment=1 # Center
    )
    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        spaceBefore=10,
        spaceAfter=5
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        spaceAfter=10
    )
    bold_body_style = ParagraphStyle(
        'DocBoldBody',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )

    story = []
    story.append(Paragraph("MASTER SERVICE AGREEMENT", title_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph(
        "This Master Service Agreement (the <b>\"Agreement\"</b>) is entered into as of August 7, 2026 (the <b>\"Effective Date\"</b>), "
        "by and between <b>NexusTech Solutions LLC</b>, a Delaware corporation with its principal place of business at 500 Technology Drive, "
        "Suite 400, Wilmington, DE 19801 (<b>\"Client\"</b>), and <b>Vertex Global Systems Inc.</b>, a Texas corporation with its principal "
        "place of business at 1200 Congress Ave, Austin, TX 78701 (<b>\"Service Provider\"</b>). Client and Service Provider may be referred "
        "to individually as a \"Party\" and collectively as the \"Parties.\"",
        body_style
    ))
    
    story.append(Paragraph("1. SERVICES & DELIVERABLES", h2_style))
    story.append(Paragraph(
        "1.1 Provision of Services. Service Provider shall perform professional software consulting, cloud migration, and IT "
        "infrastructure management services as defined in mutually executed Statements of Work (each, an \"SOW\"). Each SOW "
        "shall incorporate by reference the terms of this Agreement.",
        body_style
    ))
    
    story.append(Paragraph("2. PAYMENT & INVOICES", h2_style))
    story.append(Paragraph(
        "2.1 Fees. Client shall pay Service Provider the fees specified in the applicable SOW. All invoices are due and payable "
        "within thirty (30) days from the receipt of a valid and detailed invoice detailing hours and tasks completed.",
        body_style
    ))
    
    story.append(Paragraph("3. INTELLECTUAL PROPERTY", h2_style))
    story.append(Paragraph(
        "3.1 Ownership. Upon full and final payment of all outstanding invoices under an SOW, all Deliverables and custom work product "
        "created specifically for Client shall be owned exclusively by Client. Service Provider retains ownership of its pre-existing "
        "background library and proprietary utility code.",
        body_style
    ))
    
    story.append(Paragraph("4. LIMITATION OF LIABILITY", h2_style))
    story.append(Paragraph(
        "<b>4.1 UNLIMITED LIABILITY. NOTWITHSTANDING ANY OTHER CLAUSE IN THIS AGREEMENT, OR ANY SOW, THE SERVICE PROVIDER "
        "AGREES TO ASSUME COMPLETELY UNLIMITED LIABILITY FOR ANY AND ALL CLAIMS, LOSSES, DAMAGES, DEFICIENCIES, OR LIABILITIES "
        "ARISING UNDER OR IN CONNECTION WITH THE PERFORMANCE OF SERVICES. THE SERVICE PROVIDER EXPLICITLY WAIVES ANY CAP, "
        "LIMITATION, OR EXCLUSION OF CONSEQUENTIAL, INDIRECT, OR SPECIAL DAMAGES, REGARDLESS OF WHETHER SUCH LIABILITY ARISES "
        "IN CONTRACT, TORT, PRODUCT LIABILITY, OR OTHERWISE.</b>",
        bold_body_style
    ))
    
    story.append(Paragraph("5. GOVERNING LAW & JURISDICTION", h2_style))
    story.append(Paragraph(
        "5.1 Governing Law. This Agreement shall be governed by, and construed in accordance with, the laws of the State of Delaware, "
        "without regard to its conflicts of law provisions.",
        body_style
    ))
    
    story.append(Spacer(1, 20))
    story.append(Paragraph("IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.", body_style))
    story.append(Spacer(1, 10))
    
    # Signatures layout table
    sig_data = [
        [
            Paragraph("<b>NEXUSTECH SOLUTIONS LLC</b><br/><br/>By: _______________________<br/>Name: Johnathan Stark<br/>Title: Chief Operations Officer", body_style),
            Paragraph("<b>VERTEX GLOBAL SYSTEMS INC.</b><br/><br/>By: _______________________<br/>Name: Marcus Aurelius<br/>Title: Chief Executive Officer", body_style)
        ]
    ]
    t = Table(sig_data, colWidths=[250, 250])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t)
    
    doc.build(story)
    print("Master Service Agreement PDF generated successfully.")


def generate_risky_invoice_pdf(filepath):
    print(f"Generating Risky Invoice PDF: {filepath}")
    doc = SimpleDocTemplate(filepath, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        spaceAfter=15,
        alignment=2 # Right align
    )
    body_style = ParagraphStyle(
        'InvoiceBody',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        spaceAfter=10
    )
    alert_style = ParagraphStyle(
        'InvoiceAlert',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#990000'),
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )
    
    story = []
    
    # Header block
    header_data = [
        [
            Paragraph("<b>Apex Global Supplies Group</b><br/>15 Corporate Circle, Level 2<br/>London, EC1A 4HD, United Kingdom", body_style),
            Paragraph("INVOICE<br/><b>#INV-2026-88012</b><br/>Date: August 7, 2026", title_style)
        ]
    ]
    t_header = Table(header_data, colWidths=[250, 250])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 20))
    
    # Bill to
    story.append(Paragraph("<b>BILL TO:</b><br/>CogniVault Inc.<br/>Accounts Payable Department<br/>100 Tech Park Way<br/>San Francisco, CA 94105", body_style))
    story.append(Spacer(1, 15))
    
    # Line items table
    item_data = [
        ["Description", "Hours / Qty", "Rate", "Total"],
        ["Q3 Enterprise Infrastructure Scaling & Offsite Database Optimization", "1", "$950,000.00", "$950,000.00"],
        ["", "", "Total Due:", "$950,000.00 USD"]
    ]
    t_items = Table(item_data, colWidths=[280, 70, 70, 80])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,1), 0.5, colors.HexColor('#cbd5e1')),
        ('FONTNAME', (2,2), (3,2), 'Helvetica-Bold'),
    ]))
    story.append(t_items)
    story.append(Spacer(1, 25))
    
    # Risky bank details instruction
    story.append(Paragraph("<b>⚠️ URGENT ACTION REQUIRED — NEW PAYMENT INSTRUCTIONS</b>", alert_style))
    story.append(Paragraph(
        "<b>Please note that our primary Barclays Bank account in London is currently undergoing an annual system audit. "
        "Effective immediately, DO NOT send payments to our previous account.</b>",
        alert_style
    ))
    
    story.append(Paragraph(
        "Please wire the full amount of <b>$950,000.00 USD</b> to our offshore liquidity bank partner in the Cayman Islands:<br/>"
        "<b>Bank Name:</b> Cayman Islands Offshore Trust & Savings<br/>"
        "<b>Account Number:</b> 1109-2849-002<br/>"
        "<b>Routing Code / SWIFT:</b> CAYM-9912 / CIOTS331<br/>"
        "<b>Payment Term:</b> Immediate (within 24 hours of invoice receipt to prevent immediate account suspension).",
        body_style
    ))
    
    story.append(Spacer(1, 15))
    story.append(Paragraph("Authorized by: <i>Richard Hendricks</i> (Verified Finance Officer Signature)", body_style))
    story.append(Paragraph("IP Origin of Billing Gateway: <b>197.210.65.15 (Lagos, Nigeria)</b>", body_style))
    
    doc.build(story)
    print("Risky Invoice PDF generated successfully.")


def generate_employee_details_txt(filepath):
    print(f"Generating Employee Details PII TXT file: {filepath}")
    content = """CONFIDENTIAL COGNIVAULT HUMAN RESOURCES RECORD
DATE: August 07, 2026
CLASSIFICATION: HIGHLY RESTRICTED (HR & PAYROLL ONLY)

1. EMPLOYEE PROFILE
Full Legal Name: Sarah Elizabeth Jenkins
Date of Birth: May 14, 1984
Social Security Number (SSN): 342-99-8801
Employee Identification Number: CV-88014-X

2. CONTACT INFORMATION
Personal Email: sarah.jenkins.private@gmail.com
Work Email: sjenkins@cognivault.com
Primary Phone Number: +1-415-555-0143
Residential Address: 928 Pine Street, Apartment 4B, San Francisco, CA 94108

3. COMPENSATION & BANKING DETAILS
Current Base Salary: $165,000.00 USD (Exempt status, bi-weekly payroll)
Payment Method: Direct Deposit
Financial Institution: Wells Fargo Bank, N.A.
Routing Transit Number (RTN): 121000248
Account Number: 4829910023
Account Type: Primary Checking

4. EMERGENCY CONTACT DETAILS
Primary Contact: Robert Jenkins
Relationship to Employee: Spouse
Primary Contact Phone: +1-415-555-0178
Emergency Contact Email: robert.jenkins.family@yahoo.com

5. SECURITY CLEARANCE & COMPLIANCE SIGN-OFF
IP Access Profile: 192.168.1.100 (Internal VPN Gateway)
Approved Signature: /s/ Sarah E. Jenkins
Date: July 15, 2026
"""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Employee Details PII TXT file generated successfully.")


if __name__ == "__main__":
    demo_dir = os.path.dirname(os.path.abspath(__file__))
    
    msa_path = os.path.join(demo_dir, "Master_Service_Agreement_New.pdf")
    invoice_path = os.path.join(demo_dir, "Risky_Invoice_New.pdf")
    employee_path = os.path.join(demo_dir, "Employee_Details_PII.txt")
    
    generate_msa_pdf(msa_path)
    generate_risky_invoice_pdf(invoice_path)
    generate_employee_details_txt(employee_path)
    
    print("\nAll files generated in the demo directory successfully!")
