import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// Expected Schema for the AI to return
const TicketAnalysisSchema = z.object({
    category: z.enum(['refund request', 'bug report', 'product question', 'feedback', 'general']),
    urgency: z.enum(['low', 'medium', 'high']),
    assignee_name: z.enum(['Tech Support (Alice)', 'Billing (Bob)', 'General Support (Charlie)', 'Unassigned']).describe("Assign to Tech Support for bugs, Billing for refunds, General Support for feedback or general questions."),
    language: z.string().describe("The original language of the email, e.g., 'German', 'English'"),
    translated_body: z.string().describe("The english translation of the user's email."),
    ai_draft_response: z.string().describe("A polite draft reply answering the user, written in the user's ORIGINAL language."),
    extracted_entities: z.object({
        mentioned_names: z.array(z.string()).optional(),
        order_ids: z.array(z.string()).optional(),
    }).optional()
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { subject, text, from_email, from_name } = body;

        if (!text || !from_email) {
            return NextResponse.json({ error: 'Missing required fields: text, from_email' }, { status: 400 });
        }

        // 0. IMPORTANT: Outlook Threading Logic
        // Check if this incoming email is actually a reply to an existing ticket
        const cleanSubject = subject ? subject.replace(/^(Re|Fwd|Aw|Tr):\s*/i, '').trim() : '';
        let existingTicket = null;

        if (cleanSubject && supabase) {
            const { data } = await supabase.from('tickets')
                .select('id')
                .eq('user_email', from_email)
                .ilike('subject', `%${cleanSubject}%`)
                .maybeSingle();

            if (data) existingTicket = data;
        }

        if (existingTicket && supabase) {
            // It's a reply! Append it to the existing thread.
            await supabase.from('messages').insert({
                ticket_id: existingTicket.id,
                sender_type: 'user',
                sender_name: from_name || 'Customer',
                body: text
            });

            // Reopen the ticket since the user replied
            await supabase.from('tickets').update({ status: 'open' }).eq('id', existingTicket.id);

            return NextResponse.json({ success: true, message: "Appended to existing thread via Outlook reply sync", ticket_id: existingTicket.id });
        }

        // 1. Process the email content with Gemini (New Ticket)
        const { object: analysis } = await generateObject({
            model: google('gemini-2.5-flash'),
            schema: TicketAnalysisSchema,
            prompt: `
        Analyze the following support email.
        Sender: ${from_name || 'Unknown'} (${from_email})
        Subject: ${subject || 'No Subject'}
        
        Body: 
        ${text}
        
        Instructions:
        1. Detect the language. If it's not English, translate it for the "translated_body" field. If it is English, keep it as is.
        2. Categorize the email logically into one of the following exact types: 'refund request', 'bug report', 'product question', 'feedback', 'general'.
        3. Assess the urgency (e.g. refund requests or angry customers are 'high').
        4. Draft a highly professional and polite reply in the ORIGINAL language, acknowledging the issue.
        5. Extract any meaningful names or order IDs mentioned.
        6. Determine the correct assignee_name for this ticket based on its categorization.
      `,
        });

        console.log("AI Analysis Complete:", analysis);

        // 2. Insert into Supabase (if configured)
        if (supabase) {
            // Create user mock enrichment data if not exists
            await supabase.from('user_data_mocks').upsert({
                user_email: from_email,
                sentry_error_link: `https://sentry.io/studyflash/issues/?query=${from_email}`,
                posthog_session_link: `https://app.posthog.com/project/123/person/${from_email}`,
                total_spend: Math.floor(Math.random() * 200)
            }, { onConflict: 'user_email' });

            // Create Ticket
            const { data: ticket, error: ticketError } = await supabase.from('tickets').insert({
                subject: subject || 'New Support Request',
                body_original: text,
                body_translated: analysis.translated_body,
                language: analysis.language,
                category: analysis.category,
                urgency: analysis.urgency,
                user_email: from_email,
                user_name: from_name,
                ai_draft_response: analysis.ai_draft_response,
                assignee_name: analysis.assignee_name
            }).select().single();

            if (ticketError) throw new Error(ticketError.message);

            // Create initial message thread
            await supabase.from('messages').insert({
                ticket_id: ticket.id,
                sender_type: 'user',
                sender_name: from_name || 'Customer',
                body: text
            });

            return NextResponse.json({ success: true, ticket_id: ticket.id, analysis });
        } else {
            // Mock mode: Just return the AI analysis if DB is not configured (for easy testing)
            return NextResponse.json({
                success: true,
                message: "No Supabase configuration detected. Returning AI analysis only.",
                analysis
            });
        }

    } catch (err: any) {
        console.error("Webhook processing error:", err);
        return NextResponse.json({ error: err.message || 'Server Error' }, { status: 500 });
    }
}
