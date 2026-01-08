
import docx
import sys
import os
import asyncio
from datetime import date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from docx.document import Document
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.table import _Cell, Table
from docx.text.paragraph import Paragraph

# Models
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from src.api.models.tenant import Tenant
from src.api.models.organization import Organization
from src.api.models.billing import Billing
from src.api.database import Base

# DB Config
DB_URL = os.environ.get(
    "DATABASE_URL", 
    "postgresql+asyncpg://sugukuru_admin:temporary-password-123@35.187.223.4/sugukuru"
)
engine = create_async_engine(DB_URL, echo=False)
SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

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

async def get_or_create_tenant(db: AsyncSession):
    stmt = select(Tenant).limit(1)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()
    if not tenant:
        # Should exist by now, but just in case
        tenant = Tenant(name="スグクル株式会社", plan="enterprise")
        db.add(tenant)
        await db.commit()
    return tenant.tenant_id

async def find_organization(db: AsyncSession, name: str, tenant_id):
    # Try exact match
    stmt = select(Organization).where(Organization.tenant_id == tenant_id, Organization.name == name)
    result = await db.execute(stmt)
    org = result.scalar_one_or_none()
    if org: return org
    
    # Try fuzzy or partial? For now just return None
    return None

async def import_data(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    doc = docx.Document(file_path)
    
    current_client = "Unknown"
    # Target month is November 2025 based on filename "請求書_2025_11月稼働分.docx"
    target_month = "2025-11"
    billing_date = date(2025, 11, 30)

    invoices = []
    current_invoice_items = []

    print("Parsing document...")

    for block in iter_block_items(doc):
        if isinstance(block, Paragraph):
            text = block.text.strip()
            if not text:
                continue
            
            if "御中" in text:
                if current_invoice_items:
                   invoices.append({
                       "client": current_client,
                       "items": current_invoice_items
                   })
                   current_invoice_items = []
                
                current_client = text.replace("御中", "").strip()
                # Clean up name if needed
                current_client = current_client.replace("株式会社", "").replace("有限会社", "").replace("合同会社", "").strip()
                # Add back prefix/suffix properly if we want exact matching? 
                # Actually for matching it's better to keep original text but stripped of honorifics.
                # Let's keep "株式会社" etc for now as 'client_name' in Billing, but when searching Org we might need flexible search.
                # Re-reading: The text is "株式会社 〇〇〇〇 御中".
                current_client = text.replace("御中", "").strip()
            
        elif isinstance(block, Table):
            headers = [cell.text.strip() for cell in block.rows[0].cells]
            if "摘要" in headers and "明細金額" in headers:
                for row in block.rows[1:]:
                    cells = [cell.text.strip().replace("\n", " ") for cell in row.cells]
                    if not cells[0]: continue
                    
                    if len(cells) >= 4:
                        desc = cells[0]
                        qty_str = cells[1]
                        unit_price_str = cells[2].replace(",", "")
                        amount_str = cells[3].replace(",", "")
                        
                        try:
                            amount = int(amount_str)
                            current_invoice_items.append({
                                "description": desc,
                                "quantity": qty_str,
                                "unit_price": unit_price_str,
                                "amount": amount
                            })
                        except ValueError:
                            pass

    if current_invoice_items:
        invoices.append({
            "client": current_client,
            "items": current_invoice_items
        })

    print(f"Parsed {len(invoices)} invoices.")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        await db.execute(select(1)) # Test connection
        tenant_id = await get_or_create_tenant(db)
        
        imported_count = 0
        
        for inv in invoices:
            client_name = inv['client']
            items = inv['items']
            total = sum(i['amount'] for i in items)
            
            # Link Organization
            # We try to match somewhat loosely if exact match fails?
            # Or just save client_name.
            # In import_eight.py we saved full names like "株式会社AA".
            # The docx has "株式会社AA 御中". 
            # So `client_name` here is "株式会社AA". It should match.
            org = await find_organization(db, client_name, tenant_id)
            
            billing = Billing(
                tenant_id=tenant_id,
                org_id=org.org_id if org else None,
                client_name=client_name,
                billing_date=billing_date,
                target_month=target_month,
                total_amount=total,
                items=items,
                status='sent'
            )
            db.add(billing)
            imported_count += 1
            print(f"Imported: {client_name} ({total:,} JPY) -> {'Linked Org' if org else 'No Org Link'}")

        await db.commit()
        print(f"Successfully imported {imported_count} invoices into DB.")

if __name__ == "__main__":
    file_path = "請求書_2025_11月稼働分.docx"
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    
    if not DB_URL:
        print("Error: DATABASE_URL not set")
    else:
        asyncio.run(import_data(file_path))
