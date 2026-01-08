
import docx
import sys
import os
import re
from docx.document import Document
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.table import _Cell, Table
from docx.text.paragraph import Paragraph

def iter_block_items(parent):
    if isinstance(parent, Document):
        parent_elm = parent.element.body
    elif isinstance(parent, _Cell):
        parent_elm = parent._tc
    else:
        raise ValueError("something's not right")

    for child in parent_elm.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)

def parse_billing_docx(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    doc = docx.Document(file_path)
    
    current_client = "Unknown"
    current_date = "2025-11-30" # Default based on filename
    invoices = []
    
    current_invoice_items = []

    print("[Parsed Data]")
    
    for block in iter_block_items(doc):
        if isinstance(block, Paragraph):
            text = block.text.strip()
            if not text:
                continue
            
            # rudimentary client detection
            if "御中" in text:
                # Save previous if any
                if current_invoice_items:
                   invoices.append({
                       "client": current_client,
                       "items": current_invoice_items
                   })
                   current_invoice_items = []
                
                current_client = text.replace("御中", "").strip()
                # Remove titles like 株式会社 if needed, or keep
                print(f"--> Found Client: {current_client}")
            
        elif isinstance(block, Table):
            # Parse table
            # Check headers
            headers = [cell.text.strip() for cell in block.rows[0].cells]
            if "摘要" in headers and "明細金額" in headers:
                for row in block.rows[1:]: # Skip header
                    cells = [cell.text.strip().replace("\n", " ") for cell in row.cells]
                    if not cells[0]: # Skip empty rows
                        continue
                    
                    # Description, Qty, Unit Price, Amount
                    if len(cells) >= 4:
                        desc = cells[0]
                        qty_str = cells[1]
                        unit_price_str = cells[2].replace(",", "")
                        amount_str = cells[3].replace(",", "")
                        
                        # Try parsing numbers
                        try:
                            amount = int(amount_str)
                            
                            current_invoice_items.append({
                                "description": desc,
                                "quantity": qty_str,
                                "unit_price": unit_price_str,
                                "amount": amount
                            })
                        except ValueError:
                            pass # Skip rows that don't have valid amount numbers (like subtotals or empty)

    # Add last one
    if current_invoice_items:
        invoices.append({
            "client": current_client,
            "items": current_invoice_items
        })
    
    # Summary
    print("\n[Summary]")
    total_amount = 0
    for inv in invoices:
        inv_total = sum(item["amount"] for item in inv["items"])
        total_amount += inv_total
        print(f"Client: {inv['client']:<20} Total: {inv_total:,} JPY")
        
    print(f"Grand Total: {total_amount:,} JPY")
    return invoices

if __name__ == "__main__":
    file_path = "請求書_2025_11月稼働分.docx"
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    parse_billing_docx(file_path)
