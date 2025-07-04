
import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import jwtDecode from 'jwt-decode';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import Login from './components/Login';
import Signup from './components/Signup';
import Messaging from './components/Messaging';
import './App.css';
import chat from './assets/bubble-chat.png';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

let hasShownIntro = false;

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', quantity: '', image: null });
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageSenders, setMessageSenders] = useState([]);
  const [showIntro, setShowIntro] = useState(!hasShownIntro);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const navigate = useNavigate();

  const user = useMemo(() => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded;
    } catch (err) {
      console.error('JWT decode error:', err.message);
      setToken('');
      localStorage.removeItem('token');
      return null;
    }
  }, [token]);

  useEffect(() => {
    if (!showIntro || hasShownIntro) return;
    const introTimer = setTimeout(() => {
      setShowIntro(false);
      hasShownIntro = true;
      if (!token && window.location.pathname === '/') navigate('/login');
    }, 3000);
    return () => clearTimeout(introTimer);
  }, [showIntro, token, navigate]);

  useEffect(() => {
    if (showPopup) {
      navigate('/');
      const popupTimer = setTimeout(() => setShowPopup(false), 3000);
      return () => clearTimeout(popupTimer);
    }
  }, [showPopup, navigate]);

  useEffect(() => {
    axios.get('/api/products')
      .then(res => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(err => setError('Failed to load products'));
  }, [token]);

  useEffect(() => {
    socket.on('productsUpdated', (updatedProducts) => {
      setProducts(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(updatedProducts)) return updatedProducts;
        return prev;
      });
    });

    socket.on('messagesRead', ({ userId }) => {
      if (user && user.userId === userId) fetchUnreadCount();
    });

    socket.on('sendMessage', (message) => {
      if (user && message.receiverId === user.userId) fetchUnreadCount();
    });

    return () => {
      socket.off('productsUpdated');
      socket.off('messagesRead');
      socket.off('sendMessage');
    };
  }, [token, user]);

  useEffect(() => {
    const fetchMessageData = async () => {
      try {
        const [unreadRes, sendersRes] = await Promise.all([
          axios.get('/api/messages/unread/count', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/messages/senders', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setUnreadCount(unreadRes.data.unreadCount);
        setMessageSenders(sendersRes.data);
      } catch (err) {
        console.error('Failed to fetch message data:', err.response?.data);
        if (err.response?.status === 401) logout();
      }
    };

    if (token && !showIntro) fetchMessageData();
  }, [token, showIntro]);

  const handleChange = (e) => {
    if (e.target.name === 'image') setForm({ ...form, image: e.target.files[0] });
    else setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.role !== 'farmer') {
      alert('Only farmers can add products.');
      return;
    }
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('price', form.price);
    formData.append('quantity', form.quantity);
    if (form.image) formData.append('image', form.image);

    try {
      const res = await axios.post('/api/products', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setProducts([...products, res.data]);
      setForm({ name: '', price: '', quantity: '', image: null });
      socket.emit('productAdded');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
      if (err.response?.status === 401) logout();
    }
  };

  const addToCart = (product) => setCart([...cart, { ...product, quantity: 1 }]);
  const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));
  const checkout = () => {
    alert('Checkout successful! (Placeholder)');
    setCart([]);
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get('/api/messages/unread/count', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      if (err.response?.status === 401) logout();
    }
  };

  const handleSignupSuccess = (username) => {
    setPopupMessage(`Congratulations ${username}, signed up successfully`);
    setShowPopup(true);
  };

  const sidebarHeaderText = user?.role === 'buyer' ? 'BUYER' : 'SELLER';
  const sidebarClass = user?.role === 'buyer' ? 'buyer' : 'seller';

  if (showIntro) {
    return (
      <div className="intro-container">
        <span className="intro-logo">
          <span className="fm-f">F</span>
          <span className="fm-m">M</span>
        </span>
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav>
        <div className="container">
          <Link to="/" className="logo">
            <span className="fm-logo">
              <span className="fm-f">F</span>
              <span className="fm-m">M</span>
            </span>
            <span className="logo-text">Farmer Marketplace</span>
          </Link>
          <div className="links">
            {token ? (
              <>
                <Link to="/">Home</Link>
                <button onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/signup">Signup</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="layout">
        {showPopup && <div className="signup-popup">{popupMessage}</div>}
        {token ? (
          <aside className="sidebar">
            <h3 className={sidebarClass}>
              <span className="fm-logo">
                <span className="fm-f">F</span>
                <span className="fm-m">M</span>
              </span>
              {sidebarHeaderText}
            </h3>
            {user?.profilePic && (
              <img
                src={`${import.meta.env.VITE_API_URL}${user.profilePic}`}
                alt="Profile"
                className="profile-pic"
              />
            )}
            <p>User Name: <span className="username">{user?.username?.toUpperCase() || 'N/A'}</span></p>
            <p>User ID: {user?.userId || 'N/A'}</p>
            <div>
              <p>Messages {unreadCount > 0 && <span className="unread-count">({unreadCount} unread)</span>}</p>
              {messageSenders.length > 0 ? (
                messageSenders.map(sender => (
                  <p key={sender.userId}>
                    <Link to={`/messages/${sender.userId}`}>
                      {sender.username} (ID: {sender.userId}) <img src={chat} alt="chat" style={{ height: "25px", width: "25px" }} />
                    </Link>
                  </p>
                ))
              ) : (
                <p>No conversations yet</p>
              )}
            </div>
          </aside>
        ) : (
          <aside className="sidebar-placeholder" />
        )}
        <main className={`main-content ${!token ? 'auth-main' : ''}`}>
          {error && <p className="error">{error}</p>}
          <Routes>
            <Route
              path="/"
              element={
                <div className="main-container">
                  {token && user?.role === 'farmer' && (
                    <div className="form-section">
                      <h2>Add Product (Farmers)</h2>
                      <form onSubmit={handleSubmit}>
                        <input name="name" value={form.name} onChange={handleChange} placeholder="Product Name" required />
                        <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Price" required />
                        <input name="quantity" type="number" value={form.quantity} onChange={handleChange} placeholder="Quantity" required />
                        <input name="image" type="file" onChange={handleChange} accept="image/*" />
                        <button type="submit">Add Product</button>
                      </form>
                    </div>
                  )}
                  <div>
                    {error && <p className="error">{error}</p>}
                    <ProductList products={products} addToCart={addToCart} user={user} />
                    <Cart cart={cart} removeFromCart={removeFromCart} checkout={checkout} />
                  </div>
                </div>
              }
            />
            <Route path="/login" element={<Login setToken={setToken} />} />
            <Route path="/signup" element={<Signup setToken={setToken} onSignupSuccess={handleSignupSuccess} />} />
            <Route path="/messages/:otherUserId" element={<Messaging user={user} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
