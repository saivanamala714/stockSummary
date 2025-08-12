import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchTrendingMessagesStart } from '../store/slices/stockSlice';
import './Home.css';

const Home: React.FC = () => {
  const dispatch = useDispatch();
  const { messages, loading, error, symbol } = useSelector((state: RootState) => state.stock);

  useEffect(() => {
    dispatch(fetchTrendingMessagesStart('NVDA'));
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchTrendingMessagesStart(symbol));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'Bullish':
        return '#4CAF50';
      case 'Bearish':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading trending messages for {symbol}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <header className="header">
        <h1>StockTwits Trending Messages</h1>
        <div className="symbol-info">
          <span className="symbol">{symbol}</span>
          <button onClick={handleRefresh} className="refresh-button">
            Refresh
          </button>
        </div>
      </header>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No trending messages found for {symbol}</p>
          </div>
        ) : (
          <div className="messages-grid">
            {messages.map((message) => (
              <div key={message.id} className="message-card">
                <div className="message-header">
                  <div className="user-info">
                    <img
                      src={message.user.avatar_url}
                      alt={message.user.username}
                      className="avatar"
                    />
                    <div className="user-details">
                      <span className="username">@{message.user.username}</span>
                      <span className="name">{message.user.name}</span>
                    </div>
                  </div>
                  {message.sentiment && (
                    <div
                      className="sentiment"
                      style={{ color: getSentimentColor(message.sentiment.basic) }}
                    >
                      {message.sentiment.basic}
                    </div>
                  )}
                </div>

                <div className="message-body">
                  <p>{message.body}</p>
                </div>

                <div className="message-footer">
                  <div className="symbols">
                    {message.symbols.map((s) => (
                      <span key={s.id} className="symbol-tag">
                        {'$' + s.symbol}
                      </span>
                    ))}
                  </div>
                  <span className="timestamp">
                    {formatDate(message.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
