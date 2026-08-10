import { useState, useEffect, useRef, useCallback } from 'react';
import { api, ApiError } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader } from '@/components/ui/ErrorState';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/contexts/AuthContext';
import type { Message } from '@/types';
import { MessageSquare, Send } from 'lucide-react';

export default function MessagesPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<{ id: string; name: string; role: string }[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (contactId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMessages(contactId);
      setMessages(res.messages);
      setContacts(res.contacts);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages('').catch(() => {});
  }, [loadMessages]);

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact);
    }
  }, [selectedContact, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim() || !selectedContact) return;
    setSending(true);
    setSendError(null);
    try {
      await api.sendMessage(selectedContact, content);
      setContent('');
      await loadMessages(selectedContact);
    } catch (e) {
      setSendError(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader title="الرسائل" subtitle="التواصل مع الطلاب والمشرفين والمديرين" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          {/* Contacts list */}
          <div className="card p-0 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-neutral-100">
              <h3 className="font-bold text-neutral-800">المحادثات</h3>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {loading && contacts.length === 0 ? (
                <div className="p-4 flex justify-center"><Spinner /></div>
              ) : contacts.length === 0 ? (
                <p className="text-sm text-neutral-400 p-4 text-center">لا توجد محادثات</p>
              ) : (
                contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact.id)}
                    className={`w-full text-right p-4 border-b border-neutral-50 hover:bg-primary-50 transition-colors ${
                      selectedContact === contact.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <p className="font-medium text-neutral-800 text-sm">{contact.name}</p>
                    <p className="text-xs text-neutral-400">
                      {contact.role === 'admin' ? 'مدير' : contact.role === 'supervisor' ? 'مشرف' : 'طالب'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="lg:col-span-2 card p-0 overflow-hidden flex flex-col">
            {!selectedContact ? (
              <EmptyState
                icon={<MessageSquare className="w-8 h-8" />}
                title="اختر محادثة"
                message="اختر جهة اتصال من القائمة لبدء المراسلة."
              />
            ) : (
              <>
                <div className="p-4 border-b border-neutral-100">
                  <h3 className="font-bold text-neutral-800">
                    {contacts.find((c) => c.id === selectedContact)?.name || 'محادثة'}
                  </h3>
                </div>

                {error && <div className="p-4"><Alert type="error" message={error} /></div>}

                <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
                  {loading && messages.length === 0 ? (
                    <div className="flex justify-center"><Spinner /></div>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-8">لا توجد رسائل. ابدأ المحادثة!</p>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[70%] p-3 rounded-2xl ${
                            isMine ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-800'
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isMine ? 'text-primary-100' : 'text-neutral-400'}`}>
                              {new Date(msg.createdAt).toLocaleString('ar-SA')}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {sendError && <div className="px-4 pb-2"><Alert type="error" message={sendError} /></div>}

                <div className="p-4 border-t border-neutral-100 flex gap-2">
                  <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                    placeholder="اكتب رسالتك..."
                    className="input-field flex-1"
                    disabled={sending}
                  />
                  <button onClick={handleSend} disabled={sending || !content.trim()} className="btn-filled">
                    {sending ? <Spinner size="sm" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
