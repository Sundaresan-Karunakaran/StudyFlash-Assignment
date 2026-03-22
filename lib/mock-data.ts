export type Ticket = {
    id: string;
    subject: string;
    body_original: string;
    body_translated: string;
    language: string;
    category: string;
    status: 'open' | 'closed';
    urgency: 'low' | 'medium' | 'high';
    assignee_name?: string;
    user_email: string;
    user_name: string;
    ai_draft_response: string;
    created_at: string;
};

export type Message = {
    id: string;
    ticket_id: string;
    sender_type: 'user' | 'agent' | 'ai';
    sender_name: string;
    body: string;
    created_at: string;
};

export const mockTickets: Ticket[] = [
    {
        id: "1",
        subject: "Refund my subscription",
        body_original: "Guten Tag\nIch habe vergessen mein Jahresabo von Studyflash zu kündigen. Ich hätte es bis gestern den 19.01.2026 machen müssen. Gibt es eine Möglichkeit das Abo zu kündigen und mein Geld wieder zurückzubekommen?\nIch hatte das Jahresabo für 2025 gekaut und hab nicht daran gedacht, dass es sich automatisch verlängert.\n60 CHF für ein Abo sind gerade viel Geld für mich.\nVielen Dank\nFreundliche Grüsse\nAnastasia Schlickeiser",
        body_translated: "Good day. I forgot to cancel my annual Studyflash subscription. I should have done it by yesterday, Jan 19, 2026. Is there a way to cancel the subscription and get my money back? I bought the annual subscription for 2025 and didn't realize it auto-renews. 60 CHF is a lot of money for me right now. Thank you. Kind regards, Anastasia Schlickeiser",
        language: "German",
        category: "refund request",
        status: "open",
        urgency: "high",
        assignee_name: "Billing (Bob)",
        user_email: "anastasia@example.com",
        user_name: "Anastasia Schlickeiser",
        ai_draft_response: "Guten Tag Anastasia,\n\nvielen Dank für Ihre Nachricht. Wir verstehen, dass es ärgerlich ist, eine Kündigungsfrist zu verpassen.\n\nDa die Frist erst gestern abgelaufen ist, haben wir aus Kulanz Ihr Abonnement storniert und die Zahlung von 60 CHF vollständig erstattet. Das Geld sollte in den nächsten 3-5 Werktagen auf Ihrem Konto eingehen.\n\nWir hoffen, Sie in Zukunft wieder bei Studyflash begrüßen zu dürfen.\n\nFreundliche Grüße,\nIhr Studyflash Support-Team",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
        id: "2",
        subject: "App keeps crashing on startup",
        body_original: "Hi team,\nEver since the new update yesterday, the iOS app crashes immediately when I try to open my flashcards. I'm preparing for finals and really need this fixed ASAP!\nDevice: iPhone 13, iOS 17.2\nThanks, Mark",
        body_translated: "Hi team, Ever since the new update yesterday, the iOS app crashes immediately when I try to open my flashcards. I'm preparing for finals and really need this fixed ASAP! Device: iPhone 13, iOS 17.2 Thanks, Mark",
        language: "English",
        category: "bug report",
        status: "open",
        urgency: "high",
        assignee_name: "Tech Support (Alice)",
        user_email: "mark.student@univ.edu",
        user_name: "Mark T.",
        ai_draft_response: "Hi Mark,\n\nI am so sorry to hear the app is crashing for you right before finals! That sounds incredibly frustrating.\n\nOur engineering team is aware of an issue introduced in yesterday's iOS update affecting flashcard rendering on iOS 17, and we are pushing an emergency patch right now. It should be available in the App Store within the next 24 hours.\n\nIn the meantime, you can securely access all your flashcards without interruption via our web portal on your phone or laptop.\n\nThank you for your patience,\nStudyflash Support",
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    }
];

export const mockMessages: Message[] = [
    {
        id: "m1",
        ticket_id: "1",
        sender_type: 'user',
        sender_name: "Anastasia Schlickeiser",
        body: "Guten Tag\nIch habe vergessen mein Jahresabo von Studyflash zu kündigen. Ich hätte es bis gestern den 19.01.2026 machen müssen. Gibt es eine Möglichkeit das Abo zu kündigen und mein Geld wieder zurückzubekommen?",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
        id: "m2",
        ticket_id: "2",
        sender_type: 'user',
        sender_name: "Mark T.",
        body: "Hi team,\nEver since the new update yesterday, the iOS app crashes immediately when I try to open my flashcards. I'm preparing for finals and really need this fixed ASAP!\nDevice: iPhone 13, iOS 17.2\nThanks, Mark",
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    }
];
