import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

const InboxPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/conversations`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setConversations(res.data);
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError("Failed to load conversations.");
      } finally {
        setLoading(false);
      }
    };

    if (user && user.token) {
      fetchConversations();
    } else if (!user) {
      setLoading(false);
      setError("Please log in to view your inbox.");
    }
  }, [user, API_BASE_URL]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-700">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
        <p className="mt-4 text-lg font-medium">Loading conversations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h2 className="text-3xl font-bold text-red-600">Oops!</h2>
        <p className="mt-2 text-gray-600">{error}</p>
        <button
          onClick={() => navigate("/login")}
          className="mt-6 rounded-lg bg-green-600 px-6 py-2 text-white font-semibold shadow hover:bg-green-700 transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl bg-white shadow-lg ring-1 ring-gray-100 p-6">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-6">
            Your Inbox
          </h1>

          {conversations.length === 0 ? (
            <p className="text-center text-gray-500 text-lg">
              No conversations yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {conversations.map((conv) => (
                <li key={conv._id}>
                  <Link
                    to={`/chat/${conv._id}`}
                    className="block rounded-xl border border-gray-100 p-4 hover:shadow-md hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {conv.participants
                            .map(
                              (p) => p.businessName || p.name || p.email
                            )
                            .join(", ")}
                        </h3>
                        {conv.lastMessage && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                            {conv.lastMessage.content}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {conv.unreadCount > 0 && (
                          <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                            {conv.unreadCount} New
                          </span>
                        )}
                        {conv.lastMessage && (
                          <span className="text-xs text-gray-400">
                            {new Date(
                              conv.lastMessage.createdAt
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
