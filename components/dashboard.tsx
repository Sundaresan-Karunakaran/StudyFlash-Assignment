"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Search, Inbox, AlertCircle, CheckCircle, Clock, Send, Bot, User, ShieldAlert, Sparkles, InboxIcon } from "lucide-react";
import { Ticket, Message } from "@/lib/mock-data";
import { fetchMessages, fetchEnrichmentData, sendMessage, fetchTickets, updateTicketStatus } from "@/lib/data-access";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Dashboard({ initialTickets }: { initialTickets: Ticket[] }) {
    const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(initialTickets[0]?.id || null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [enrichment, setEnrichment] = useState<any>(null);
    const [replyText, setReplyText] = useState("");
    const [isSending, setIsSending] = useState(false);

    const selectedTicket = tickets.find(t => t.id === selectedTicketId);

    // Auto-updating WebSockets (Realtime Sync) via Supabase
    useEffect(() => {
        if (!supabase) return;

        const channel = supabase
            .channel('realtime-sync')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tickets' },
                () => fetchTickets().then(setTickets)
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    // Refetch messages instantly if the new incoming message belongs to the active thread
                    if (selectedTicketId && payload.new.ticket_id === selectedTicketId) {
                        fetchMessages(selectedTicketId).then(setMessages);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase?.removeChannel(channel);
        };
    }, [selectedTicketId]);

    useEffect(() => {
        console.log("Hello")
        if (selectedTicket) {
            console.log("selectedTicket", selectedTicket);
            fetchMessages(selectedTicket.id).then(setMessages);
            fetchEnrichmentData(selectedTicket.user_email).then(setEnrichment);
            setReplyText(selectedTicket.ai_draft_response || "");
        }
    }, [selectedTicket]);
    useEffect(() => {
        console.log(messages)
    }, [messages])
    const handleSendReply = async () => {
        if (!replyText || !selectedTicket) return;
        setIsSending(true);

        const savedMsg = await sendMessage(selectedTicket.id, replyText, 'You (Agent)');

        setTimeout(() => {
            setMessages([...messages, savedMsg]);
            setReplyText("");
            setIsSending(false);
        }, 500);
    };

    const handleResolve = async () => {
        if (!selectedTicket) return;
        const newStatus = selectedTicket.status === 'open' ? 'closed' : 'open';

        // Optimistic UI Update
        setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t));
        await updateTicketStatus(selectedTicket.id, newStatus);
    };

    // Filter tickets by search
    const filteredTickets = tickets.filter(t =>
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user_email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">

            {/* LEFT PANE: Ticket List */}
            <div className="w-[380px] border-r bg-white flex flex-col shrink-0">
                <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2 font-bold text-lg text-slate-800">
                        <div className="p-1.5 rounded-md">
                            <img src="studyflash_logo.svg" alt="Logo" width={24} height={24} />
                        </div>
                        Studyflash Support
                    </div>
                </div>
                <div className="p-4 border-b bg-slate-50/50">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search emails, users..."
                            className="pl-9 bg-white shadow-sm border-slate-200"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-3 flex flex-col gap-2">
                        {filteredTickets.map(ticket => (
                            <div
                                key={ticket.id}
                                onClick={() => setSelectedTicketId(ticket.id)}
                                className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedTicketId === ticket.id
                                    ? 'border-indigo-200 ring-1 ring-indigo-500 bg-indigo-50/50 shadow-sm'
                                    : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <div className="font-semibold text-sm truncate pr-2 text-slate-900">
                                        {ticket.user_name}
                                        {ticket.status === 'closed' && (
                                            <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold tracking-widest uppercase">
                                                Resolved
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-500 whitespace-nowrap">
                                        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                                    </div>
                                </div>
                                <div className="text-sm font-medium mb-2 truncate text-slate-800">{ticket.subject}</div>
                                <div className="flex gap-1.5 flex-wrap mt-2">
                                    <Badge variant={ticket.urgency === 'high' ? 'destructive' : 'secondary'} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0 h-5">
                                        {ticket.urgency}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-600 px-2 py-0 h-5">
                                        {ticket.category.replace('-', ' ')}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* CENTER PANE: Email Thread */}
            {selectedTicket ? (
                <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
                    <div className="p-6 border-b bg-white flex justify-between items-center shadow-sm z-10">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{selectedTicket.subject}</h2>
                            <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                <span>{selectedTicket.user_email}</span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center"><Globe className="w-3 h-3 mr-1" />Detected Language: {selectedTicket.language}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={selectedTicket.status === 'closed' ? "secondary" : "outline"}
                                size="sm"
                                className={selectedTicket.status === 'closed' ? "bg-slate-100 border-none" : "bg-white"}
                                onClick={handleResolve}
                            >
                                <CheckCircle className={`w-4 h-4 mr-2 ${selectedTicket.status === 'closed' ? 'text-slate-400' : 'text-emerald-600'}`} />
                                {selectedTicket.status === 'closed' ? 'Reopen' : 'Resolve'}
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <div className="max-w-3xl mx-auto flex flex-col gap-6">
                            {messages.map((msg, idx) => {
                                console.log("Hello2")
                                console.log(msg)
                                return (
                                    <div key={msg.id} className={`flex gap-4 ${msg.sender_type === 'agent' ? 'flex-row-reverse' : ''}`}>
                                        <Avatar className={`w-10 h-10 border ${msg.sender_type === 'agent' ? 'bg-indigo-100 border-indigo-200' : 'bg-white border-slate-200'}`}>
                                            <AvatarFallback className={msg.sender_type === 'agent' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}>
                                                {msg.sender_type === 'agent' ? 'AG' : msg.sender_name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={`flex flex-col gap-1 ${msg.sender_type === 'agent' ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm text-slate-900">{msg.sender_name}</span>
                                                <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                                            </div>
                                            <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap max-w-xl shadow-sm ${msg.sender_type === 'agent'
                                                ? 'bg-indigo-600 text-white rounded-tr-sm'
                                                : 'bg-white border border-slate-200 rounded-tl-sm text-slate-800'
                                                }`}>
                                                {msg.body}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                        </div>
                    </ScrollArea>

                    {/* Reply Box */}
                    <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                        <div className="max-w-4xl mx-auto flex flex-col gap-3">
                            <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type your reply. It will sync back to the Outlook thread..."
                                className="min-h-[120px] resize-none border-slate-200 focus-visible:ring-indigo-500 bg-slate-50/50"
                            />
                            <div className="flex justify-between items-center">
                                <div className="text-xs text-slate-500 flex items-center">
                                    <Sparkles className="w-3 h-3 mr-1 text-indigo-500" /> AI drafted this reply based on context. Edit as needed.
                                </div>
                                <Button onClick={handleSendReply} disabled={isSending || !replyText} className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
                                    {isSending ? <Clock className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                    Send via Outlook
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                    <InboxIcon className="w-16 h-16 mb-4 opacity-20" />
                    <p>Select a ticket to view thread</p>
                </div>
            )}

            {/* RIGHT PANE: Context & Enrichment */}
            {selectedTicket && (
                <div className="w-[340px] border-l bg-slate-50/80 shrink-0 overflow-y-auto hidden lg:block">
                    <div className="p-5">
                        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center">
                            <Bot className="w-4 h-4 mr-2 text-indigo-600" /> AI Insights
                        </h3>

                        <div className="space-y-4">
                            {/* Analysis Card */}
                            <Card className="border-indigo-100 shadow-sm bg-white overflow-hidden">
                                <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100">
                                    <CardTitle className="text-sm font-semibold text-indigo-900 flex items-center">Translation (English)</CardTitle>
                                </div>
                                <CardContent className="p-4 text-sm text-slate-700 leading-relaxed">
                                    {selectedTicket.body_translated || selectedTicket.body_original}
                                </CardContent>
                            </Card>

                            {/* Urgency Alert */}
                            {selectedTicket.urgency === 'high' && (
                                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
                                    <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-red-900 text-sm">High Urgency Detected</h4>
                                        <p className="text-xs text-red-700 mt-1">AI flagged this as high urgency based on sentiment and category.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-px bg-slate-200 my-6"></div>

                        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center">
                            <User className="w-4 h-4 mr-2 text-slate-600" /> Triage & Context
                        </h3>

                        {selectedTicket.assignee_name && (
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-4 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500">Assigned Expert</span>
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-slate-100">{selectedTicket.assignee_name}</Badge>
                            </div>
                        )}

                        {enrichment ? (
                            <div className="space-y-3">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                    <div className="text-xs font-medium text-slate-500 mb-1">Customer LTV</div>
                                    <div className="text-lg font-bold text-slate-900">{enrichment.total_spend} CHF</div>
                                </div>

                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2">
                                    <a href={enrichment.sentry_error_link} target="_blank" className="text-sm text-slate-700 hover:text-indigo-600 font-medium flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-2 text-rose-500" /> View Sentry Exceptions
                                    </a>
                                    <a href={enrichment.posthog_session_link} target="_blank" className="text-sm text-slate-700 hover:text-indigo-600 font-medium flex items-center">
                                        <Clock className="w-4 h-4 mr-2 text-amber-500" /> Watch PostHog Session
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500">Loading user context...</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const Globe = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
)
