
import React from 'react';
import ClientList, { Client } from './ClientList';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

async function getClients(): Promise<Client[]> {
    try {
        // Specifically looking for the Eight CSV file
        // In a real app, this would be a DB query or dynamic file upload
        const files = fs.readdirSync(process.cwd());
        const csvFile = files.find(f => f.startsWith('Eight') && f.endsWith('.csv'));

        if (!csvFile) {
            console.log("Eight CSV file not found");
            return [];
        }

        const filePath = path.join(process.cwd(), csvFile);

        // Use XLSX to parse CSV safely
        const fileContent = fs.readFileSync(filePath);
        const wb = XLSX.read(fileContent, { type: 'buffer' });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];

        // Convert to JSON with header row 0
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Skip header
        const rows = rawData.slice(1) as string[][];

        /*
           Header Mapping based on provided CSV structure:
           0: 会社名
           1: 部署名
           2: 役職
           3: 姓
           4: 名
           5: e-mail
           6: 郵便番号
           7: 住所
           8: TEL会社
           9: TEL部門
           10: TEL直通
           11: Fax
           12: 携帯電話
           13: URL
           14: 名刺交換日
        */

        return rows.map((row, index) => {
            const address = row[7] || '';
            let prefecture = '';

            // Simple prefecture extraction
            const prefectures = [
                "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
                "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
                "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
                "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
                "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
                "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
                "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
            ];

            for (const p of prefectures) {
                if (address.startsWith(p)) {
                    prefecture = p;
                    break;
                }
            }

            // Fallback for address without prefecture if possible (unlikely in standardized data but good to have)

            return {
                id: `client-${index}`,
                companyName: row[0] || '不明な会社',
                department: row[1] || '',
                position: row[2] || '',
                lastName: row[3] || '',
                firstName: row[4] || '',
                email: row[5] || '',
                postalCode: row[6] || '',
                address: address,
                phone: row[8] || row[9] || row[10] || '', // Priority: Company > Dept > Direct
                mobile: row[12] || '',
                url: row[13] || '',
                exchangeDate: row[14] || '',
                source: 'Eight',
                prefecture: prefecture || 'その他'
            } as Client;
        }).filter(c => c.companyName); // Filter out empty rows if any

    } catch (error) {
        console.error("Error reading clients:", error);
        return [];
    }
}

export default async function ClientsPage() {
    const clients = await getClients();

    return (
        <div className="animate-fadeIn">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">顧客管理</h1>
                <p className="text-gray-500 mt-1">Eight名刺データを活用した顧客データベース</p>
            </div>

            <ClientList initialClients={clients} />
        </div>
    );
}
