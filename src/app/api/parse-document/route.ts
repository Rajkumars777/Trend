
import { NextResponse } from 'next/server';

// Force Node.js runtime for pdf-parse compatibility
export const runtime = 'nodejs';

// Disable static optimization since we handle FormData
export const dynamic = 'force-dynamic';


export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = "";

        if (file.type === 'application/pdf') {
            console.log("📄 Processing PDF...");
            const pdfParse = require('pdf-parse/lib/pdf-parse.js');
            const data = await pdfParse(buffer);
            text = data.text;
            console.log("✅ PDF Parsed successfully. Text length:", text.length);
        } else if (file.type === 'text/plain') {
            text = buffer.toString('utf-8');
        } else {
            return NextResponse.json({ error: "Unsupported file type. Only PDF and TXT are supported." }, { status: 400 });
        }

        // Clean up text (limit size if needed)
        const cleanedText = text.replace(/\s+/g, ' ').trim().substring(0, 20000); // Limit to ~20k chars context

        return NextResponse.json({ text: cleanedText });

    } catch (error: any) {
        console.error("❌ Document Parse Error:", error);
        console.error("Stack:", error.stack);
        return NextResponse.json({
            error: "Failed to parse document",
            details: error.message
        }, { status: 500 });
    }
}
