import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2 } from 'lucide-react';
import { markConversationAsRead } from '../services/chatService';

const ChatPage = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [chatTitle, setChatTitle] = useState('Chat');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const messagesRes = await axios.get(
          `${API_BASE_URL}/conversations/${conversationId}/messages`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setMessages(messagesRes.data);

        const conversationRes = await axios.get(
          `${API_BASE_URL}/conversations/${conversationId}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        const otherParticipant = conversationRes.data.participants.find(p => p._id !== user.id);
        if (otherParticipant) {
          setChatTitle(`Chat with ${otherParticipant.businessName || otherParticipant.name}`);
        }

        if (conversationId && user && user.token) {
          await markConversationAsRead(conversationId);
        }
      } catch (err) {
        console.error('Error fetching chat data:', err);
        setError('Failed to load chat. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.token && conversationId) fetchMessages();
    else if (!user || !user.token) {
      setLoading(false);
      setError('Please log in to view this chat.');
    } else if (!conversationId) {
      setLoading(false);
      setError('No conversation selected.');
    }
  }, [user, conversationId, API_BASE_URL]);

  useEffect(() => scrollToBottom(), [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    try {
      const messageRes = await axios.post(
        `${API_BASE_URL}/messages`,
        { conversationId, content: newMessage },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setMessages(prev => [...prev, messageRes.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-gray-700">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
        <p className="mt-4 text-lg font-medium">Loading chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center">
        <h2 className="text-3xl font-bold text-red-600">Oops!</h2>
        <p className="mt-2 text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto w-full max-w-3xl">
        <Card className="shadow-lg rounded-2xl bg-white">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl font-extrabold text-gray-800">{chatTitle}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col p-6">
            <div className="flex-1 h-96 overflow-y-auto mb-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500">No messages yet. Start the conversation!</p>
              ) : (
                messages.map(msg => {
                  const isUser = msg.sender === user.id;
                  return (
                    <div key={msg._id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2 rounded-lg ${isUser ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                        <p className="font-semibold text-sm">{isUser ? 'You' : msg.sender.businessName || msg.sender.name}</p>
                        <p className="mt-1">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 rounded-lg border-gray-300"
              />
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white rounded-lg">Send</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatPage;
/**/