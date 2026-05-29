import React, { useState, useEffect, useRef } from 'react';
import { playChatSound, getNameColor, getYoutubeEmbedUrl, getLocalDateString } from './utils/helpers';

// Pages
import { Home } from './pages/Home';
import { Episodes } from './pages/Episodes';
import { EpisodeDetail } from './pages/EpisodeDetail';
import { Community } from './pages/Community';
import { Games } from './pages/Games';
import { PlayGame } from './pages/PlayGame';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';
import { Rewards } from './pages/Rewards';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Confirm } from './pages/Confirm';
import { Admin } from './pages/Admin';

// Components
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav } from './components/BottomNav';
import { CustomModal } from './components/CustomModal';
import { Toast } from './components/Toast';
import { XPPopup } from './components/XPPopup';

// Use environment variable VITE_API_BASE if defined, otherwise detect localhost / local networks
const API_BASE = import.meta.env.VITE_API_BASE || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') 
    ? `http://${window.location.hostname}:5000` 
    : ''
);

function App() {
  // Navigation State
  const [currentPage, setCurrentPage] = useState('home'); // home, episodes, community, games, leaderboard, profile, rewards, episode-detail, play-game, login, register, confirm, admin
  
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [confirmEmail, setConfirmEmail] = useState('');
  
  // App Data
  const [episodes, setEpisodes] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardTab, setLeaderboardTab] = useState('all-time'); // all-time, weekly, batch
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  
  // Forms
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', batch: 'PT 11' });
  const [confirmCode, setConfirmCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [loginReward, setLoginReward] = useState<any>(null);

  // Redeem code
  const [secretCode, setSecretCode] = useState('');
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');
  const [xpPopups, setXpPopups] = useState<any[]>([]);

  // Chat/Community State
  const [communityTab, setCommunityTab] = useState<'feed' | 'chat'>('feed');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [activeReactionMenu, setActiveReactionMenu] = useState<number | null>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([]);
  const [activeContextMenu, setActiveContextMenu] = useState<any>(null);
  const [swipeTranslateX, setSwipeTranslateX] = useState<{ [key: number]: number }>({});
  const [lastSeenMessageId, setLastSeenMessageId] = useState<number>(() => Number(localStorage.getItem('lastSeenMessageId') || '0'));
  const [customModal, setCustomModal] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);

  // Polls Mock State
  const [pollVotes, setPollVotes] = useState<number[]>([42, 12, 8, 25]);
  const [hasVotedPoll, setHasVotedPoll] = useState(false);
  const [userVotedOption, setUserVotedOption] = useState<number | null>(null);

  // Multiplayer Room Game States
  const [activeGameRoom, setActiveGameRoom] = useState<any>(null);
  const [gameRoomCodeInput, setGameRoomCodeInput] = useState('');
  const [createGameRounds, setCreateGameRounds] = useState(5);
  const [createGameDuration, setCreateGameDuration] = useState(60);
  const [submittedGameAnswer, setSubmittedGameAnswer] = useState('');
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [gameError, setGameError] = useState('');
  const [gameTab, setGameTab] = useState<'single' | 'multiplayer'>('single');
  const [isMultiplayerExpanded, setIsMultiplayerExpanded] = useState(false);

  // Single-player Games States
  const [activeGame, setActiveGame] = useState<any>(null); // memory, spin, quiz
  const [gameQuestionIdx, setGameQuestionIdx] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [gameFeedback, setGameFeedback] = useState('');
  const [gamePlayError, setGamePlayError] = useState('');
  const [gamePlaySuccess, setGamePlaySuccess] = useState('');

  // Memory Game State
  const [memoryCards, setMemoryCards] = useState<any[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryMatches, setMemoryMatches] = useState(0);
  
  // Spin Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  // Cosmetics Equips State
  const [equippedFrame, setEquippedFrame] = useState(localStorage.getItem('eq_frame') || 'none');
  const [equippedTitle, setEquippedTitle] = useState(localStorage.getItem('eq_title') || 'none');
  const [unlockedCosmetics, setUnlockedCosmetics] = useState<string[]>(
    JSON.parse(localStorage.getItem('cosmetics') || '[]')
  );

  // Episode Details State
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | null>(null);
  const [episodeDetail, setEpisodeDetail] = useState<any>(null);
  const [episodeDetailLoading, setEpisodeDetailLoading] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [commentInput, setCommentInput] = useState('');
  const [episodeInteracting, setEpisodeInteracting] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState<any>(null);

  // Admin Section State
  const [adminSection, setAdminSection] = useState('episodes');
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminCodes, setAdminCodes] = useState([]);
  const [adminEpisodeForm, setAdminEpisodeForm] = useState({
    title_ar: '', title_en: '', description: '', thumbnail_url: '', youtube_url: '',
    quiz_question: '', quiz_options: ['', '', '', ''], quiz_correct: 0,
    code: '', code_max_uses: 200, code_expiry: ''
  });
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminCodeForm, setAdminCodeForm] = useState({ code: '', xp_reward: 50, type: 'social', max_uses: 1000, expiry_date: '' });
  const [adminSuggestions, setAdminSuggestions] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Moderation state
  const [moderationUser, setModerationUser] = useState<{ username: string; id: number } | null>(null);
  const [moderationAction, setModerationAction] = useState('mute');
  const [moderationDuration, setModerationDuration] = useState('1d');

  // References
  const chatMessagesRef = useRef(chatMessages);
  const userRef = useRef(user);
  const holdTimeoutRef = useRef<any>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const swipeMessageIdRef = useRef<number | null>(null);
  const prevMessagesCountRef = useRef<number>(0);
  const prevPageRef = useRef<string>('');

  // Toast Functionality
  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    let timer: any;
    if (toastMessage) {
      timer = setTimeout(() => setToastMessage(null), 2500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [toastMessage]);

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (currentPage === 'community' && chatMessages.length > 0) {
      const maxId = Math.max(...chatMessages.map((m: any) => Number(m.id || 0)));
      if (maxId > lastSeenMessageId) {
        setLastSeenMessageId(maxId);
        localStorage.setItem('lastSeenMessageId', maxId.toString());
      }
    }
  }, [currentPage, chatMessages, lastSeenMessageId]);

  // Sync token and load Profile
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  // Handle auto-joining pending game code from login/register
  useEffect(() => {
    if (token) {
      const pendingCode = sessionStorage.getItem('pendingGameCode');
      if (pendingCode) {
        sessionStorage.removeItem('pendingGameCode');
        handleJoinGameRoom(pendingCode);
      }
    }
  }, [token]);

  // Initial Fetching & Referral/Game Invite Tracking
  useEffect(() => {
    fetchEpisodes();
    fetchCommunityPosts();
    fetchLeaderboard();
    fetchPublicSuggestions();

    // Check query parameters for referral or game code
    const params = new URLSearchParams(window.location.search);
    const refUsername = params.get('ref');
    const refEpisodeId = params.get('episode');
    const gameCode = params.get('gameCode');

    if (gameCode) {
      const activeToken = localStorage.getItem('token');
      if (activeToken) {
        handleJoinGameRoom(gameCode);
      } else {
        sessionStorage.setItem('pendingGameCode', gameCode);
        setCurrentPage('login');
        showToast('Please log in to join the game room! 🔐');
      }
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (refUsername && refEpisodeId) {
      const activeToken = localStorage.getItem('token');
      fetch(`${API_BASE}/api/episodes/${refEpisodeId}/referral`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({ referrer: refUsername })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`You joined via a share link from @${refUsername}! 🎉`);
        }
      })
      .catch(err => console.error('Error tracking referral:', err));

      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Poll for chat and lobby
  useEffect(() => {
    fetchChatMessages();
    const chatInterval = setInterval(fetchChatMessages, communityTab === 'chat' && currentPage === 'community' ? 1500 : 8000);
    return () => clearInterval(chatInterval);
  }, [communityTab, currentPage]);

  // Autoscroll chat to bottom smartly
  useEffect(() => {
    if (currentPage === 'community') {
      const el = document.getElementById('pl-chat-feed');
      if (el) {
        const isPageChange = prevPageRef.current !== 'community';
        const hasNewMessages = chatMessages.length > prevMessagesCountRef.current;
        const lastMsg = chatMessages[chatMessages.length - 1];
        const sentByMe = lastMsg && user && lastMsg.username === user.username;
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;

        if (isPageChange || (hasNewMessages && (sentByMe || isNearBottom))) {
          el.scrollTop = el.scrollHeight;
        }
      }
    }
    prevMessagesCountRef.current = chatMessages.length;
    prevPageRef.current = currentPage;
  }, [chatMessages, currentPage, user]);

  useEffect(() => {
    if (currentPage === 'leaderboard') fetchLeaderboard();
  }, [currentPage, leaderboardTab]);

  useEffect(() => {
    let interval: any;
    if (activeGameRoom && currentPage === 'play-game') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/games/status/${activeGameRoom.code}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (activeGameRoom.status === 'waiting' && data.status === 'playing') {
              playChatSound('start');
            }
            if (activeGameRoom.status === 'playing' && data.status === 'finished') {
              playChatSound('win');
            }
            setActiveGameRoom(data);
          } else {
            setActiveGameRoom(null);
            setCurrentPage('games');
          }
        } catch (err) {
          console.error(err);
        }
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeGameRoom, currentPage]);

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      confirmText: 'OK',
      onConfirm: () => setCustomModal(null),
      type
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel',
    type: 'danger' | 'info' | 'success' | 'warning' = 'warning'
  ) => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm();
        setCustomModal(null);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setCustomModal(null);
      },
      type
    });
  };

  // HTTP API Layer Handlers
  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      } else {
        setToken('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEpisodes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/episodes`);
      const data = await res.json();
      if (res.ok) setEpisodes(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      let url = `${API_BASE}/api/leaderboard?tab=${leaderboardTab}`;
      if (leaderboardTab === 'batch' && user) {
        url += `&batch=${encodeURIComponent(user.batch)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setLeaderboard(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAdminUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminCodes = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/xp-codes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAdminCodes(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminSuggestions = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/suggestions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAdminSuggestions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPublicSuggestions = async () => {
    try {
      const activeToken = localStorage.getItem('token') || token;
      const res = await fetch(`${API_BASE}/api/suggestions`, {
        headers: activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}
      });
      const data = await res.json();
      if (res.ok) setSuggestions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAdminSubmitting(true);
    setAdminMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/xp-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: adminCodeForm.code,
          xp_reward: Number(adminCodeForm.xp_reward),
          type: adminCodeForm.type,
          max_uses: Number(adminCodeForm.max_uses),
          expiry_date: adminCodeForm.expiry_date || null
        })
      });
      const data = await res.json();
      setAdminMessage(data.message || data.error);
      if (res.ok) {
        showToast('XP Code created successfully! 🔑');
        fetchAdminCodes();
        setAdminCodeForm({ code: '', xp_reward: 50, type: 'social', max_uses: 1000, expiry_date: '' });
      }
    } catch (err) {
      setAdminMessage('Failed to connect to the server.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleAdminToggleUserRole = async (userId: number, currentRole: string) => {
    if (!token) return;
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    showConfirm(
      'Change User Role',
      `Are you sure you want to change this user's role to ${newRole === 'admin' ? 'Admin' : 'Student'}?`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
          });
          const data = await res.json();
          if (res.ok) {
            showToast(data.message || 'User role updated! 🎉');
            fetchAdminUsers();
          } else {
            showToast(data.error || 'Failed to update role.');
          }
        } catch (e) {
          showToast('Connection failed.');
        }
      }
    );
  };

  const handleAdminUpdateSuggestionStatus = async (suggestionId: number, status: 'approved' | 'rejected') => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Suggestion marked as ${status}! 💡`);
        fetchAdminSuggestions();
        fetchPublicSuggestions();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update suggestion.');
      }
    } catch (e) {
      showToast('Connection failed.');
    }
  };

  const handleCreateSuggestion = async (title: string, content: string) => {
    if (!token) {
      showToast('You must be logged in to submit a suggestion. 🔐');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Thank you! Suggestion submitted successfully. 💡');
        fetchPublicSuggestions();
        triggerXpPopup(50);
        fetchUserProfile();
      } else {
        showToast(data.error || 'Failed to submit suggestion.');
      }
    } catch (e) {
      showToast('Connection failed.');
    }
  };

  const handleUpvoteSuggestion = async (suggestionId: number) => {
    if (!token) {
      showToast('You must be logged in to upvote suggestions. 🔐');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/suggestions/${suggestionId}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        playChatSound('success');
        fetchPublicSuggestions();
      } else {
        showToast(data.error || 'Failed to upvote.');
      }
    } catch (e) {
      showToast('Connection failed.');
    }
  };

  useEffect(() => {
    if (currentPage === 'admin' && user?.role === 'admin') {
      fetchAdminUsers();
      fetchAdminCodes();
      fetchAdminSuggestions();
    }
  }, [currentPage, user, token]);

  const fetchChatMessages = async () => {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/chat`, { headers });
      const data = await res.json();
      if (res.ok) {
        if (chatMessagesRef.current && chatMessagesRef.current.length > 0 && data.length > chatMessagesRef.current.length) {
          const currentIds = new Set(chatMessagesRef.current.map((m: any) => m.id));
          const hasNewIncoming = data.some((m: any) => !currentIds.has(m.id) && (!userRef.current || m.username !== userRef.current.username));
          if (hasNewIncoming) {
            playChatSound('receive');
          }
        }
        setChatMessages(data);
        const onlineHeader = res.headers.get('X-Online-Count');
        if (onlineHeader) {
          setOnlineCount(parseInt(onlineHeader, 10));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCommunityPosts = async () => {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/community/posts`, { headers });
      const data = await res.json();
      if (res.ok) setCommunityPosts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateGameRoom = async () => {
    if (!token) { showToast('Please login to play 🔐'); return; }
    setIsGameLoading(true);
    setGameError('');
    try {
      const res = await fetch(`${API_BASE}/api/games/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ rounds: createGameRounds, roundDuration: createGameDuration })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveGameRoom(data);
        setCurrentPage('play-game');
      } else {
        setGameError(data.error);
      }
    } catch (e) {
      setGameError('Connection to server failed.');
    } finally {
      setIsGameLoading(false);
    }
  };

  const handleJoinGameRoom = async (code: string) => {
    if (!token) { showToast('Please login to play 🔐'); return; }
    if (!code) { setGameError('Enter room code.'); return; }
    setIsGameLoading(true);
    setGameError('');
    try {
      const res = await fetch(`${API_BASE}/api/games/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomCode: code.toUpperCase() })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveGameRoom(data);
        setCurrentPage('play-game');
        setGameRoomCodeInput('');
      } else {
        setGameError(data.error);
      }
    } catch (e) {
      setGameError('Incorrect room code.');
    } finally {
      setIsGameLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!activeGameRoom || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/games/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomCode: activeGameRoom.code })
      });
      const data = await res.json();
      if (res.ok) setActiveGameRoom(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitGameAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittedGameAnswer.trim() || !activeGameRoom || !token) return;
    const ans = submittedGameAnswer;
    setSubmittedGameAnswer('');
    try {
      const res = await fetch(`${API_BASE}/api/games/submit-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomCode: activeGameRoom.code, answer: ans })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.isCorrect) {
          playChatSound('success');
          setActiveGameRoom(data.room);
        } else {
          playChatSound('error');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextRound = async () => {
    if (!activeGameRoom || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/games/next-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomCode: activeGameRoom.code })
      });
      const data = await res.json();
      if (res.ok) setActiveGameRoom(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlayAgain = async () => {
    if (!activeGameRoom || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/games/play-again`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomCode: activeGameRoom.code })
      });
      const data = await res.json();
      if (res.ok) setActiveGameRoom(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeaveGameRoom = async () => {
    if (!activeGameRoom || !token) return;
    try {
      await fetch(`${API_BASE}/api/games/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomCode: activeGameRoom.code })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setActiveGameRoom(null);
      setCurrentPage('games');
    }
  };

  const handleRedeem = async (e: any) => {
    e.preventDefault();
    setRedeemError('');
    setRedeemSuccess('');
    if (!token) {
      setRedeemError('Please login first.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/xp-codes/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: secretCode })
      });
      const data = await res.json();
      if (res.ok) {
        setRedeemSuccess(data.message);
        setSecretCode('');
        playChatSound('success');
        triggerXpPopup(data.xp_earned);
        fetchUserProfile();
        fetchLeaderboard();
      } else {
        setRedeemError(data.error);
        playChatSound('error');
      }
    } catch (e) {
      setRedeemError('Failed to activate code.');
    }
  };

  const triggerXpPopup = (amount: number) => {
    const id = Date.now() + Math.random();
    setXpPopups(prev => [...prev, { id, amount }]);
    setTimeout(() => {
      setXpPopups(prev => prev.filter(p => p.id !== id));
    }, 1500);
  };

  // Auth Operations
  const handleLogin = async (e: any) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        setLoginForm({ username: '', password: '' });
        playChatSound('success');
        if (data.rewards && data.rewards.daily_login) {
          triggerXpPopup(10);
        }
        if (!sessionStorage.getItem('pendingGameCode')) {
          setCurrentPage('home');
        }
      } else {
        setAuthError(data.error);
      }
    } catch (err) {
      setAuthError('Connection error occurred.');
    }
  };

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      const data = await res.json();
      if (res.ok) {
        setAuthSuccess(data.message);
        setConfirmEmail(registerForm.email);
        setTimeout(() => {
          setCurrentPage('confirm');
          setAuthSuccess('');
        }, 1500);
      } else {
        setAuthError(data.error);
      }
    } catch (e) {
      setAuthError('Connection error occurred.');
    }
  };

  const handleConfirm = async (e: any) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: confirmEmail, code: confirmCode })
      });
      const data = await res.json();
      if (res.ok) {
        setAuthSuccess(data.message);
        setToken(data.token);
        setUser(data.user);
        setConfirmCode('');
        setTimeout(() => {
          if (!sessionStorage.getItem('pendingGameCode')) {
            setCurrentPage('home');
          }
          setAuthSuccess('');
        }, 1500);
      } else {
        setAuthError(data.error);
      }
    } catch (e) {
      setAuthError('Failed to activate account.');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setCurrentPage('home');
  };

  const navigateToEpisode = (id: number) => {
    setSelectedEpisodeId(id);
    setCurrentPage('episode-detail');
    setEpisodeDetailLoading(true);
    fetchEpisodeDetail(id);
  };

  const fetchEpisodeDetail = async (id: number) => {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/episodes/${id}`, { headers });
      const data = await res.json();
      if (res.ok) setEpisodeDetail(data);
    } catch (e) {
      console.error(e);
    } finally {
      setEpisodeDetailLoading(false);
    }
  };

  const handleEpisodeInteract = async (type: string, content?: string, parentId?: number) => {
    if (!token || !selectedEpisodeId) return;
    setEpisodeInteracting(true);
    try {
      const res = await fetch(`${API_BASE}/api/episodes/${selectedEpisodeId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type, content, parent_id: parentId })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.xp_earned > 0) triggerXpPopup(data.xp_earned);
        fetchEpisodeDetail(selectedEpisodeId);
        fetchUserProfile();
        if (type === 'comment') {
          setCommentInput('');
          setReplyingToComment(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEpisodeInteracting(false);
    }
  };

  const handleQuizSubmit = async (quizId: number) => {
    if (quizAnswer === null || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/episodes/${selectedEpisodeId}/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ quiz_id: quizId, answer_index: quizAnswer })
      });
      const data = await res.json();
      if (res.ok || res.status === 400) {
        setQuizResult(data);
        if (data.is_correct && data.xp_earned > 0) {
          triggerXpPopup(data.xp_earned);
          playChatSound('success');
          fetchUserProfile();
        } else {
          playChatSound('error');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Community Feed Interaction API calls
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: newPostContent.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setNewPostContent('');
        playChatSound('send');
        triggerXpPopup(data.xp_reward);
        fetchCommunityPosts();
        fetchUserProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikePost = async (postId: number) => {
    if (!token) { showToast('Login to interact 🔐'); return; }
    try {
      // Optimistic state update
      setCommunityPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          isLiked: !p.isLiked,
          likes_count: p.likes_count + (p.isLiked ? -1 : 1)
        };
      }));

      const res = await fetch(`${API_BASE}/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        playChatSound('react');
      } else {
        fetchCommunityPosts();
      }
    } catch (e) {
      fetchCommunityPosts();
    }
  };

  // Chat contextual and swipe gesture handlers
  const handleChatContextMenu = (e: React.MouseEvent, msg: any) => {
    e.preventDefault();
    if (!user) return;
    setActiveContextMenu({
      messageId: msg.id,
      msg,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleChatTouchStart = (e: React.TouchEvent, msg: any) => {
    if (!user) return;
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;
    
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    
    holdTimeoutRef.current = setTimeout(() => {
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
      setActiveContextMenu({
        messageId: msg.id,
        msg,
        x: clientX,
        y: clientY
      });
    }, 600);

    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    swipeMessageIdRef.current = msg.id;
  };

  const handleChatTouchMove = (e: React.TouchEvent, msg: any) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (touchStartXRef.current === null || swipeMessageIdRef.current !== msg.id) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;

    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
      if (e.cancelable) e.preventDefault();
      const dragX = Math.max(-70, deltaX);
      setSwipeTranslateX(prev => ({ ...prev, [msg.id]: dragX }));
    }
  };

  const handleChatTouchEnd = (e: React.TouchEvent, msg: any) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (swipeMessageIdRef.current === msg.id) {
      const currentTranslateX = swipeTranslateX[msg.id] || 0;
      if (currentTranslateX < -45) {
        setReplyingTo({
          id: msg.id,
          username: msg.username,
          message: msg.message
        });
        playChatSound('react');
      }
      setSwipeTranslateX(prev => {
        const updated = { ...prev };
        delete updated[msg.id];
        return updated;
      });
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    swipeMessageIdRef.current = null;
  };

  // Chat posting
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !token) return;
    if (editingMessage) {
      handleEditMessage(editingMessage.id, chatInput);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: chatInput.trim(), reply_to_id: replyingTo?.id || null })
      });
      const data = await res.json();
      if (res.ok) {
        setChatInput('');
        setReplyingTo(null);
        playChatSound('send');
        fetchChatMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleReaction = async (messageId: number, emoji: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/chat/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ emoji })
      });
      if (res.ok) {
        playChatSound('react');
        fetchChatMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditMessage = async (messageId: number, newMessage: string) => {
    if (!token || !newMessage.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/chat/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: newMessage.trim() })
      });
      if (res.ok) {
        setChatInput('');
        setEditingMessage(null);
        showToast('Message edited successfully');
        fetchChatMessages();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to edit message');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!token) return;
    showConfirm(
      'Delete Message',
      'Are you sure you want to delete this message?',
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/chat/${messageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            showToast('Message deleted');
            fetchChatMessages();
          } else {
            const data = await res.json();
            showToast(data.error || 'Failed to delete message');
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  const handleBulkDeleteMessages = async () => {
    if (!token || selectedMessageIds.length === 0) return;
    showConfirm(
      'Delete Multiple Messages',
      `Are you sure you want to delete ${selectedMessageIds.length} selected messages?`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/chat/delete-bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ messageIds: selectedMessageIds })
          });
          if (res.ok) {
            showToast('Selected messages deleted');
            setIsMultiSelectMode(false);
            setSelectedMessageIds([]);
            fetchChatMessages();
          } else {
            const data = await res.json();
            showToast(data.error || 'Failed to delete messages');
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  // Memory Game Logic
  const initMemoryGame = () => {
    const terms = ['Femur 🦴', 'Deltoid 💪', 'ACL 🎗️', 'Neuron 🧠', 'Patella 🥏', 'Spasticity ⚡', 'Clavicle 🦴', 'Synapse ⚡'];
    const deck = [...terms, ...terms]
      .map((val, idx) => ({ id: idx, value: val, isFlipped: false, isMatched: false }))
      .sort(() => Math.random() - 0.5);
    setMemoryCards(deck);
    setFlippedCards([]);
    setMemoryMoves(0);
    setMemoryMatches(0);
    setGameFinished(false);
    setGamePlaySuccess('');
    setGamePlayError('');
  };

  const handleCardClick = (index: number) => {
    if (flippedCards.length === 2 || memoryCards[index].isFlipped || memoryCards[index].isMatched) return;
    
    const newCards = [...memoryCards];
    newCards[index].isFlipped = true;
    setMemoryCards(newCards);
    
    const nextFlipped = [...flippedCards, index];
    setFlippedCards(nextFlipped);
    
    if (nextFlipped.length === 2) {
      setMemoryMoves(prev => prev + 1);
      const [firstIdx, secondIdx] = nextFlipped;
      if (newCards[firstIdx].value === newCards[secondIdx].value) {
        // Match!
        newCards[firstIdx].isMatched = true;
        newCards[secondIdx].isMatched = true;
        setMemoryCards(newCards);
        setFlippedCards([]);
        setMemoryMatches(prev => {
          const total = prev + 1;
          if (total === 8) {
            setGameFinished(true);
            playChatSound('win');
            claimGameXP();
          } else {
            playChatSound('success');
          }
          return total;
        });
      } else {
        // No match
        setTimeout(() => {
          newCards[firstIdx].isFlipped = false;
          newCards[secondIdx].isFlipped = false;
          setMemoryCards(newCards);
          setFlippedCards([]);
          playChatSound('error');
        }, 1000);
      }
    }
  };

  const claimGameXP = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/games/1/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setGamePlaySuccess(data.message);
        triggerXpPopup(data.xp_earned);
        fetchUserProfile();
      } else {
        setGamePlayError(data.error);
      }
    } catch (e) {
      setGamePlayError('Failed to save game score.');
    }
  };

  // Spin Wheel Operations
  const handleSpinWheelClick = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    // Random angle between 1440 and 2160 degrees
    const randomDegree = 1440 + Math.floor(Math.random() * 720);
    const newRot = wheelRotation + randomDegree;
    setWheelRotation(newRot);
    playChatSound('start');

    // Run a high-precision animation frame loop to play tick clicks exactly as segment lines cross 12 o'clock
    const startTime = performance.now();
    const duration = 4000; // matching CSS transition duration
    const startAngle = wheelRotation;
    let lastSegmentIndex = Math.floor((startAngle - 15) / 30);
    let lastTickTime = 0;

    const animateTicks = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Quartic ease-out curve matches the cubic-bezier easing physics
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const currentAngle = startAngle + easeProgress * randomDegree;

      // Play tick sound when boundary lines (30 degrees step with 15 degrees offset) cross 12 o'clock
      const currentSegmentIndex = Math.floor((currentAngle - 15) / 30);
      
      if (currentSegmentIndex !== lastSegmentIndex) {
        const timeNow = performance.now();
        // Throttle to max 1 click every 40ms to avoid sound bugs/context overload at high speeds
        if (timeNow - lastTickTime > 40) {
          playChatSound('tick');
          lastTickTime = timeNow;
        }
        lastSegmentIndex = currentSegmentIndex;
      }

      if (progress < 1) {
        requestAnimationFrame(animateTicks);
      }
    };
    // Start tracking ticks
    requestAnimationFrame(animateTicks);

    setTimeout(() => {
      setIsSpinning(false);
      // Math formula for 12 segments centered under the 12 o'clock pointer (0° relative to drawing, not 270°)
      const actualDeg = (360 - (newRot % 360)) % 360;
      const segs = [
        'Mystery Box 🎁', 
        '+5 XP ⚡', 
        '+30 XP ⚡', 
        '+100 XP ⚡', 
        'Try Again 🍀', 
        '+15 XP ⚡', 
        '+5 XP ⚡', 
        '+50 XP ⚡', 
        'Try Again 🍀', 
        '+20 XP ⚡', 
        '+10 XP ⚡', 
        '+5 XP ⚡'
      ];
      // Use Math.round for closest segment center matching
      const prizeIdx = Math.round(actualDeg / 30) % 12;
      const prize = segs[prizeIdx];

      showToast(`Spin Wheel: You won ${prize}`);
      let xpAmt = 0;
      if (prize.includes('XP') || prize.includes('Mystery')) {
        playChatSound('win');
        const match = prize.match(/\+(\d+)\s*XP/);
        if (match) {
          xpAmt = parseInt(match[1], 10);
        } else if (prize.includes('Mystery')) {
          xpAmt = 40; // Mystery box default
        }
        if (xpAmt > 0) {
          triggerXpPopup(xpAmt);
        }
      } else {
        playChatSound('error');
      }
      // Update state locally immediately to prevent race conditions
      const todayStr = getLocalDateString();
      setUser((prev: any) => prev ? { ...prev, last_spin_wheel_date: todayStr } : null);
      claimSpinWheelReward(xpAmt);
    }, 4000);
  };

  const handleClaimSurpriseBox = async () => {
    if (!token) return;
    const todayStr = getLocalDateString();
    setUser((prev: any) => prev ? { ...prev, last_surprise_box_date: todayStr } : null);
    try {
      const res = await fetch(`${API_BASE}/api/rewards/surprise-box`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ clientDate: todayStr })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Opened daily surprise box! You earned +50 XP ⚡');
        triggerXpPopup(data.xp_earned || 50);
        playChatSound('win');
        fetchUserProfile();
      } else {
        setUser((prev: any) => prev ? { ...prev, last_surprise_box_date: null } : null);
        showToast(data.error || 'Failed to claim daily surprise box.');
        playChatSound('error');
      }
    } catch (err) {
      setUser((prev: any) => prev ? { ...prev, last_surprise_box_date: null } : null);
      showToast('Connection error.');
    }
  };

  const claimSpinWheelReward = async (amount: number) => {
    if (!token) return;
    const todayStr = getLocalDateString();
    try {
      const res = await fetch(`${API_BASE}/api/rewards/spin-wheel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ xpAmount: amount, clientDate: todayStr })
      });
      const data = await res.json();
      if (res.ok) {
        fetchUserProfile();
      } else {
        setUser((prev: any) => prev ? { ...prev, last_spin_wheel_date: null } : null);
        showToast(data.error || 'Failed to claim spin wheel reward.');
      }
    } catch (err) {
      setUser((prev: any) => prev ? { ...prev, last_spin_wheel_date: null } : null);
      showToast('Connection error.');
    }
  };

  const claimMockReward = async (amount: number) => {
    if (!token) return;
    try {
      // Simulate rewards using single game plays endpoint to increment database score
      await fetch(`${API_BASE}/api/games/1/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      fetchUserProfile();
    } catch (e) {}
  };

  const handleAdminDeleteCode = (codeId: number, codeName: string) => {
    showConfirm(
      'Delete XP Code',
      `Are you sure you want to delete the XP Code "${codeName}"? This action cannot be undone.`,
      async () => {
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE}/api/admin/xp-codes/${codeId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await res.json();
          if (res.ok) {
            showToast(data.message || 'XP Code deleted successfully.');
            fetchAdminCodes();
          } else {
            showToast(data.error || 'Failed to delete XP Code.');
          }
        } catch (err) {
          showToast('Connection error.');
        }
      },
      undefined,
      'Delete',
      'Cancel',
      'danger'
    );
  };

  const handleOpenModerationModal = (username: string, userId: number) => {
    setModerationUser({ username, id: userId });
    setModerationAction('mute');
    setModerationDuration('1d');
  };

  const handleAdminModerateUser = async () => {
    if (!token || !moderationUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${moderationUser.id}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: moderationAction,
          duration: moderationDuration
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Successfully moderated @${moderationUser.username}`);
        setModerationUser(null);
        if (currentPage === 'admin') {
          fetchAdminUsers();
        }
      } else {
        showToast(data.error || 'Failed to apply moderation action.');
      }
    } catch (err) {
      showToast('Connection failed.');
    }
  };

  const renderModerationModal = () => {
    if (!moderationUser) return null;
    return (
      <div 
        className="pl-context-overlay" 
        style={{ 
          zIndex: 11000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }} 
        onClick={() => setModerationUser(null)}
      >
        <div 
          className="glass-card" 
          onClick={(e) => e.stopPropagation()} 
          style={{ 
            width: '90%', 
            maxWidth: '400px', 
            background: 'rgba(15, 15, 15, 0.95)', 
            border: '1px solid var(--orange)', 
            boxShadow: 'var(--shadow-orange-intense)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            direction: 'ltr',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--orange)' }}>
              🛡️ Moderation: @{moderationUser.username}
            </h3>
            <button 
              onClick={() => setModerationUser(null)}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}
            >
              <i className="ti ti-x"></i>
            </button>
          </div>

          <div className="pl-form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, marginBottom: '6px', display: 'block' }}>Select Action</label>
            <select 
              className="pl-input"
              value={moderationAction}
              onChange={(e) => setModerationAction(e.target.value)}
            >
              <option value="mute">Mute User (Chat & Comments)</option>
              <option value="unmute">Unmute User</option>
              <option value="ban">Ban User (Login Restriction)</option>
              <option value="unban">Unban User</option>
            </select>
          </div>

          {(moderationAction === 'mute' || moderationAction === 'ban') && (
            <div className="pl-form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, marginBottom: '6px', display: 'block' }}>Duration</label>
              <select 
                className="pl-input"
                value={moderationDuration}
                onChange={(e) => setModerationDuration(e.target.value)}
              >
                <option value="1h">1 Hour</option>
                <option value="1d">1 Day</option>
                <option value="1w">1 Week</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button 
              className="btn-primary" 
              style={{ flex: 1 }} 
              onClick={handleAdminModerateUser}
            >
              Apply Action
            </button>
            <button 
              className="btn-outline" 
              style={{ flex: 1 }} 
              onClick={() => setModerationUser(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Shop Purchases
  const handleShopPurchase = (itemId: string, cost: number) => {
    if (!user) { showToast('Login to browse the shop 🔐'); return; }
    if (user.total_xp < cost) {
      showToast('You do not have enough XP to purchase! 😢');
      playChatSound('error');
      return;
    }
    if (unlockedCosmetics.includes(itemId)) {
      showToast('You already own this item!');
      return;
    }
    showConfirm(
      'Confirm Purchase',
      `Do you want to buy this item for ${cost} XP?`,
      () => {
        const nextUnlocked = [...unlockedCosmetics, itemId];
        setUnlockedCosmetics(nextUnlocked);
        localStorage.setItem('cosmetics', JSON.stringify(nextUnlocked));
        showToast('Purchase successful! 🎉 Go to your profile to equip it.');
        playChatSound('success');
      }
    );
  };

  // Poll Vote Handler
  const handlePollVote = (idx: number) => {
    if (hasVotedPoll) return;
    setPollVotes(prev => {
      const next = [...prev];
      next[idx] = next[idx] + 1;
      return next;
    });
    setHasVotedPoll(true);
    setUserVotedOption(idx);
    playChatSound('success');
    triggerXpPopup(30);
    claimMockReward(30);
  };

  // Admin and other helpers
  const handleAdminCreateEpisode = async (e: any) => {
    e.preventDefault();
    setAdminSubmitting(true);
    setAdminMessage('');
    try {
      const body: any = {
        title_ar: adminEpisodeForm.title_ar, title_en: adminEpisodeForm.title_en,
        description: adminEpisodeForm.description, thumbnail_url: adminEpisodeForm.thumbnail_url,
        youtube_url: adminEpisodeForm.youtube_url
      };
      if (adminEpisodeForm.quiz_question) {
        body.quiz = {
          question: adminEpisodeForm.quiz_question,
          options: adminEpisodeForm.quiz_options.filter((o: string) => o.trim()),
          correct_option_index: adminEpisodeForm.quiz_correct
        };
      }
      if (adminEpisodeForm.code) {
        body.xp_code = { code: adminEpisodeForm.code, max_uses: adminEpisodeForm.code_max_uses, expiry_date: adminEpisodeForm.code_expiry || null };
      }
      const res = await fetch(`${API_BASE}/api/admin/episode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setAdminMessage(data.message || data.error);
      if (res.ok) {
        fetchEpisodes();
        setAdminEpisodeForm({ title_ar: '', title_en: '', description: '', thumbnail_url: '', youtube_url: '', quiz_question: '', quiz_options: ['', '', '', ''], quiz_correct: 0, code: '', code_max_uses: 200, code_expiry: '' });
      }
    } catch (err) {
      setAdminMessage('Connection to server failed.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  // Sub-pages render functions
  const renderHome = () => {
    return (
      <Home
        user={user}
        loginReward={loginReward}
        navigateToEpisode={navigateToEpisode}
        setCurrentPage={setCurrentPage}
        setCommunityTab={setCommunityTab}
        pollVotes={pollVotes}
        userVotedOption={userVotedOption}
        hasVotedPoll={hasVotedPoll}
        handlePollVote={handlePollVote}
        newPostContent={newPostContent}
        setNewPostContent={setNewPostContent}
        handleCreatePost={handleCreatePost}
        communityPosts={communityPosts}
        handleLikePost={handleLikePost}
        showToast={showToast}
      />
    );
  };

  const renderEpisodesPage = () => {
    return (
      <Episodes
        episodes={episodes}
        navigateToEpisode={navigateToEpisode}
      />
    );
  };

  const renderEpisodeDetailPage = () => {
    return (
      <EpisodeDetail
        episodeDetailLoading={episodeDetailLoading}
        episodeDetail={episodeDetail}
        user={user}
        setCurrentPage={setCurrentPage}
        handleEpisodeInteract={handleEpisodeInteract}
        handleQuizSubmit={handleQuizSubmit}
        redeemError={redeemError}
        redeemSuccess={redeemSuccess}
        handleRedeem={handleRedeem}
        secretCode={secretCode}
        setSecretCode={setSecretCode}
        quizAnswer={quizAnswer}
        setQuizAnswer={setQuizAnswer}
        quizResult={quizResult}
        setQuizResult={setQuizResult}
        commentInput={commentInput}
        setCommentInput={setCommentInput}
        replyingToComment={replyingToComment}
        setReplyingToComment={setReplyingToComment}
        showToast={showToast}
        handleOpenModerationModal={handleOpenModerationModal}
      />
    );
  };

  const renderCommunityPage = () => {
    return (
      <Community
        user={user}
        onlineCount={onlineCount}
        chatMessages={chatMessages}
        isMultiSelectMode={isMultiSelectMode}
        setIsMultiSelectMode={setIsMultiSelectMode}
        selectedMessageIds={selectedMessageIds}
        setSelectedMessageIds={setSelectedMessageIds}
        swipeTranslateX={swipeTranslateX}
        swipeMessageIdRef={swipeMessageIdRef}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        editingMessage={editingMessage}
        setEditingMessage={setEditingMessage}
        chatInput={chatInput}
        setChatInput={setChatInput}
        handleSendChatMessage={handleSendChatMessage}
        setCurrentPage={setCurrentPage}
        activeContextMenu={activeContextMenu}
        setActiveContextMenu={setActiveContextMenu}
        handleChatContextMenu={handleChatContextMenu}
        handleChatTouchStart={handleChatTouchStart}
        handleChatTouchMove={handleChatTouchMove}
        handleChatTouchEnd={handleChatTouchEnd}
        handleToggleReaction={handleToggleReaction}
        handleDeleteMessage={handleDeleteMessage}
        handleBulkDeleteMessages={handleBulkDeleteMessages}
        suggestions={suggestions}
        handleCreateSuggestion={handleCreateSuggestion}
        handleUpvoteSuggestion={handleUpvoteSuggestion}
        handleOpenModerationModal={handleOpenModerationModal}
      />
    );
  };

  const renderGamesPage = () => {
    const todayStr = getLocalDateString();
    const hasSpunToday = !!(user && user.last_spin_wheel_date === todayStr);
    return (
      <Games
        user={user}
        gameTab={gameTab}
        setGameTab={setGameTab}
        activeGame={activeGame}
        setActiveGame={setActiveGame}
        gameFinished={gameFinished}
        setGameFinished={setGameFinished}
        memoryMoves={memoryMoves}
        memoryMatches={memoryMatches}
        gamePlaySuccess={gamePlaySuccess}
        gamePlayError={gamePlayError}
        initMemoryGame={initMemoryGame}
        memoryCards={memoryCards}
        handleCardClick={handleCardClick}
        wheelRotation={wheelRotation}
        handleSpinWheelClick={handleSpinWheelClick}
        isSpinning={isSpinning}
        gameError={gameError}
        createGameRounds={createGameRounds}
        setCreateGameRounds={setCreateGameRounds}
        createGameDuration={createGameDuration}
        setCreateGameDuration={setCreateGameDuration}
        handleCreateGameRoom={handleCreateGameRoom}
        gameRoomCodeInput={gameRoomCodeInput}
        setGameRoomCodeInput={setGameRoomCodeInput}
        handleJoinGameRoom={handleJoinGameRoom}
        isGameLoading={isGameLoading}
        hasSpunToday={hasSpunToday}
      />
    );
  };

  const renderPlayGamePage = () => {
    return (
      <PlayGame
        activeGameRoom={activeGameRoom}
        user={user}
        handleLeaveGameRoom={handleLeaveGameRoom}
        handleStartGame={handleStartGame}
        handleSubmitGameAnswer={handleSubmitGameAnswer}
        submittedGameAnswer={submittedGameAnswer}
        setSubmittedGameAnswer={setSubmittedGameAnswer}
        handleNextRound={handleNextRound}
        handlePlayAgain={handlePlayAgain}
        showToast={showToast}
        token={token}
      />
    );
  };

  const renderLeaderboardPage = () => {
    return (
      <Leaderboard
        user={user}
        leaderboard={leaderboard}
        leaderboardTab={leaderboardTab}
        setLeaderboardTab={setLeaderboardTab}
      />
    );
  };

  const renderProfilePage = () => {
    return (
      <Profile
        user={user}
        equippedFrame={equippedFrame}
        setEquippedFrame={setEquippedFrame}
        equippedTitle={equippedTitle}
        setEquippedTitle={setEquippedTitle}
        unlockedCosmetics={unlockedCosmetics}
        setCurrentPage={setCurrentPage}
        handleLogout={handleLogout}
      />
    );
  };

  const renderRewardsPage = () => {
    const todayStr = getLocalDateString();
    const hasOpenedBoxToday = !!(user && user.last_surprise_box_date === todayStr);
    return (
      <Rewards
        user={user}
        redeemError={redeemError}
        redeemSuccess={redeemSuccess}
        handleRedeem={handleRedeem}
        secretCode={secretCode}
        setSecretCode={setSecretCode}
        showToast={showToast}
        triggerXpPopup={triggerXpPopup}
        claimMockReward={claimMockReward}
        unlockedCosmetics={unlockedCosmetics}
        handleShopPurchase={handleShopPurchase}
        hasOpenedBoxToday={hasOpenedBoxToday}
        handleClaimSurpriseBox={handleClaimSurpriseBox}
      />
    );
  };

  const renderLoginPage = () => {
    return (
      <Login
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        authError={authError}
        handleLogin={handleLogin}
        setCurrentPage={setCurrentPage}
      />
    );
  };

  const renderRegisterPage = () => {
    return (
      <Register
        registerForm={registerForm}
        setRegisterForm={setRegisterForm}
        authError={authError}
        authSuccess={authSuccess}
        handleRegister={handleRegister}
        setCurrentPage={setCurrentPage}
      />
    );
  };

  const renderConfirmPage = () => {
    return (
      <Confirm
        confirmCode={confirmCode}
        setConfirmCode={setConfirmCode}
        authError={authError}
        authSuccess={authSuccess}
        handleConfirm={handleConfirm}
      />
    );
  };

  const renderAdminPage = () => {
    return (
      <Admin
        adminSection={adminSection}
        setAdminSection={setAdminSection}
        adminMessage={adminMessage}
        adminEpisodeForm={adminEpisodeForm}
        setAdminEpisodeForm={setAdminEpisodeForm}
        handleAdminCreateEpisode={handleAdminCreateEpisode}
        adminSubmitting={adminSubmitting}
        adminUsers={adminUsers}
        adminCodes={adminCodes}
        adminSuggestions={adminSuggestions}
        adminCodeForm={adminCodeForm}
        setAdminCodeForm={setAdminCodeForm}
        handleAdminCreateCode={handleAdminCreateCode}
        handleAdminToggleUserRole={handleAdminToggleUserRole}
        handleAdminUpdateSuggestionStatus={handleAdminUpdateSuggestionStatus}
        handleAdminDeleteCode={handleAdminDeleteCode}
        handleOpenModerationModal={handleOpenModerationModal}
      />
    );
  };

  // Profile rings decoration generator
  const getAvatarFrameClass = () => {
    if (equippedFrame === 'gold-glow') return 'avatar-frame-gold-glow';
    if (equippedFrame === 'neon-ring') return 'avatar-frame-neon-ring';
    return '';
  };

  const unseenCount = currentPage === 'community' ? 0 : chatMessages.filter((msg: any) => Number(msg.id || 0) > lastSeenMessageId).length;

  return (
    <div className="app-layout">
      {/* Background Watermark/Reflections */}
      <div className="ambient-glow-bg"></div>

      {/* Floating XP Popups */}
      <XPPopup popups={xpPopups} />

      {/* Desktop Sticky Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        setCommunityTab={setCommunityTab}
        unseenCount={unseenCount}
        user={user}
        equippedTitle={equippedTitle}
        getAvatarFrameClass={getAvatarFrameClass}
      />

      {/* Main Column Wrapper */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
        {/* Mobile Header */}
        <MobileHeader
          setCurrentPage={setCurrentPage}
          user={user}
          getAvatarFrameClass={getAvatarFrameClass}
        />

        {/* Main Content Router */}
        <main className="app-main">
          {currentPage === 'home' && renderHome()}
          {currentPage === 'episodes' && renderEpisodesPage()}
          {currentPage === 'episode-detail' && renderEpisodeDetailPage()}
          {currentPage === 'community' && renderCommunityPage()}
          {currentPage === 'games' && renderGamesPage()}
          {currentPage === 'play-game' && renderPlayGamePage()}
          {currentPage === 'leaderboard' && renderLeaderboardPage()}
          {currentPage === 'rewards' && renderRewardsPage()}
          {currentPage === 'profile' && renderProfilePage()}
          {currentPage === 'login' && renderLoginPage()}
          {currentPage === 'register' && renderRegisterPage()}
          {currentPage === 'confirm' && renderConfirmPage()}
          {currentPage === 'admin' && renderAdminPage()}
        </main>

        {/* Mobile sticky bottom navigation */}
        <BottomNav
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setCommunityTab={setCommunityTab}
          unseenCount={unseenCount}
          user={user}
        />
      </div>

      {/* Global alert/confirm overlay */}
      <CustomModal modal={customModal} />

      {/* Moderation Overlay Dialog */}
      {renderModerationModal()}

      {/* Toast Notification element */}
      <Toast message={toastMessage} />
    </div>
  );
}

export default App;
