'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AdminChatList from '@/src/admin/chat/AdminChatList';
import AdminChatConversation from '@/src/admin/chat/AdminChatConversation';

function ChatsContent() {
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');

  if (id) {
    return <AdminChatConversation chatId={id} />;
  }

  return <AdminChatList />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-xs text-slate-400 p-4">Loading chats...</div>}>
      <ChatsContent />
    </Suspense>
  );
}
