import { supabase } from '@/lib/supabase';
import { mockTickets, mockMessages, Ticket, Message } from '@/lib/mock-data';

export async function fetchTickets(): Promise<Ticket[]> {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data && data.length > 0) return data as Ticket[];
        } catch (e) {
            console.warn("Supabase fetch failed, falling back to mock data.", e);
        }
    }
    return mockTickets;
}

export async function fetchMessages(ticketId: string): Promise<Message[]> {
    console.log("fetchMessages called with:", ticketId);
    console.log("supabase", supabase);
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });

            console.log("supabase response:", { data, error });

            if (error) throw error;
            if (data && data.length > 0) return data as Message[];
        } catch (e) {
            console.warn("Supabase fetch failed, falling back to mock data.", e);
        }
    }

    return mockMessages.filter(m => m.ticket_id === ticketId);
}

export async function fetchEnrichmentData(email: string) {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('user_data_mocks').select('*').eq('user_email', email).maybeSingle();
            if (!error && data) return data;
        } catch (e) { }
    }
    // Fallback
    return {
        sentry_error_link: `https://sentry.io/studyflash/issues/?query=${email}`,
        posthog_session_link: `https://app.posthog.com/project/123/person/${email}`,
        total_spend: Math.floor(Math.random() * 200)
    };
}

export async function sendMessage(ticketId: string, body: string, senderName: string): Promise<Message> {
    const newMsg = {
        ticket_id: ticketId,
        sender_type: 'agent',
        sender_name: senderName,
        body: body,
    };

    if (supabase) {
        try {
            const { data, error } = await supabase.from('messages').insert([newMsg]).select().single();
            if (!error && data) return data as Message;
            console.warn("Supabase insert failed:", error);
        } catch (e) {
            console.error("Supabase insert error:", e);
        }
    }

    // Fallback Mock Logic
    return {
        ...newMsg,
        sender_type: 'agent',
        id: Math.random().toString(),
        created_at: new Date().toISOString()
    };
}

export async function updateTicketStatus(ticketId: string, status: 'open' | 'closed'): Promise<void> {
    if (supabase) {
        try {
            await supabase.from('tickets').update({ status }).eq('id', ticketId);
        } catch (e) {
            console.error("Supabase update error:", e);
        }
    }
}
