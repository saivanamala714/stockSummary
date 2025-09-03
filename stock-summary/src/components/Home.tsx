import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchTrendingMessagesStart, setSearchQuery, setSymbol } from '../store/slices/stockSlice';
import { getUserPredictionScore } from '../utils/sentimentAnalysis';
import './Home.css';

interface MarketSentiment {
  totalBullish: number;
  totalBearish: number;
  avgScore: number;
  sentimentColor: string;
  totalTraders: number;
  sentimentSummary: string;
  topBullishReasons: string[];
  topBearishReasons: string[];
  mentionedEvents: string[];
}

interface ExtendedUserStats {
  bullishTweets: number;
  bearishTweets: number;
  predictionScore: number;
  topBullishReasons?: string[];
  topBearishReasons?: string[];
  mentionedEvents?: string[];
}

interface MessageWithStats {
  message: any;
  userStats: ExtendedUserStats;
}

const Home: React.FC = () => {
  const dispatch = useDispatch();
  const { messages, loading, error, symbol, availableTickers, searchQuery } = useSelector((state: RootState) => state.stock);

  // Helper functions
  const getScoreColor = (score: number): string => {
    if (score >= 70) return '#4CAF50'; // Green for high confidence
    if (score >= 40) return '#FFC107'; // Yellow for medium confidence
    return '#F44336'; // Red for low confidence
  };

  const getTextColor = (score: number): string => {
    return score >= 40 ? '#000000' : '#FFFFFF';
  };

  // 1. Sort messages by followers
  const sortedMessages = useMemo(() => {
    return [...messages].map(message => ({
      ...message,
      user: {
        ...message.user,
        followers: (message.user.followers ?? message.user.followers_count ?? 0) as number
      }
    })).sort((a, b) => b.user.followers - a.user.followers);
  }, [messages]);

  // 2. Calculate user stats for each message
  const messagesWithUserStats = useMemo(() => {
    return sortedMessages.map(message => ({
      message,
      userStats: getUserPredictionScore(message.user.id, messages)
    }));
  }, [sortedMessages, messages]);

  // 3. Calculate overall market sentiment (depends on messagesWithUserStats)
  const marketSentiment = useMemo((): MarketSentiment | null => {
    if (messages.length === 0) return null;
    
    let totalBullish = 0;
    let totalBearish = 0;
    let totalScore = 0;
    
    // Collect all reasons and events across all users
    const allBullishReasons = new Map<string, number>();
    const allBearishReasons = new Map<string, number>();
    const allEvents = new Set<string>();
    
    (messagesWithUserStats as unknown as MessageWithStats[]).forEach(({ userStats }) => {
      totalBullish += userStats.bullishTweets;
      totalBearish += userStats.bearishTweets;
      totalScore += userStats.predictionScore;
      
      // Aggregate reasons and events
      userStats.topBullishReasons?.forEach((reason: string) => {
        allBullishReasons.set(reason, (allBullishReasons.get(reason) || 0) + 1);
      });
      
      userStats.topBearishReasons?.forEach((reason: string) => {
        allBearishReasons.set(reason, (allBearishReasons.get(reason) || 0) + 1);
      });
      
      userStats.mentionedEvents?.forEach((event: string) => {
        allEvents.add(event);
      });
    });
    
    const totalTraders = messagesWithUserStats.length;
    const avgScore = totalTraders > 0 ? Math.round(totalScore / totalTraders) : 0;
    
    // Get top 3 most mentioned reasons
    const getTopReasons = (reasons: Map<string, number>): string[] => {
      return Array.from(reasons.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([reason]) => reason);
    };
    
    // Generate sentiment summary
    let sentimentSummary = '';
    if (avgScore >= 70) {
      sentimentSummary = 'Strongly Bullish';
    } else if (avgScore >= 55) {
      sentimentSummary = 'Bullish';
    } else if (avgScore <= 30) {
      sentimentSummary = 'Strongly Bearish';
    } else if (avgScore <= 45) {
      sentimentSummary = 'Bearish';
    } else {
      sentimentSummary = 'Neutral';
    }
    
    // Add context to summary
    const bullishReasons = getTopReasons(allBullishReasons);
    const bearishReasons = getTopReasons(allBearishReasons);
    
    if (bullishReasons.length > 0) {
      sentimentSummary += ` with positive sentiment around: ${bullishReasons.join(', ')}`;
    }
    if (bearishReasons.length > 0) {
      sentimentSummary += ` and concerns about: ${bearishReasons.join(', ')}`;
    }
    if (allEvents.size > 0) {
      sentimentSummary += `. Watching events: ${Array.from(allEvents).slice(0, 3).join('; ')}`;
    }
    
    return {
      totalBullish,
      totalBearish,
      avgScore,
      sentimentColor: getScoreColor(avgScore),
      totalTraders,
      sentimentSummary,
      topBullishReasons: getTopReasons(allBullishReasons),
      topBearishReasons: getTopReasons(allBearishReasons),
      mentionedEvents: Array.from(allEvents).slice(0, 5)
    };
  }, [messages.length, messagesWithUserStats]);

  useEffect(() => {
    dispatch(fetchTrendingMessagesStart('NVDA'));
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchTrendingMessagesStart(symbol));
  };

  const handleSymbolSelect = (selectedSymbol: string) => {
    dispatch(setSymbol(selectedSymbol));
    dispatch(fetchTrendingMessagesStart(selectedSymbol));
  };

  const filteredTickers = availableTickers.filter(ticker => 
    ticker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (symbol) {
      dispatch(fetchTrendingMessagesStart(symbol));
    }
  }, [dispatch]);

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
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
      <div className="home">
        <div className="home-header">
          <h1>Stock Summary</h1>
        </div>
        <div className="home-content">
          <div className="trending-container">
            <h2>Trending Today</h2>
            <p>{error}</p>
            <button onClick={handleRefresh} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      <header className="header">
        <h1>StockTwits Market Sentiment</h1>
        <div className="ticker-selector">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search ticker..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="ticker-search"
            />
            {searchQuery && (
              <div className="ticker-dropdown">
                {filteredTickers.length > 0 ? (
                  filteredTickers.map((ticker) => (
                    <div
                      key={ticker}
                      className="ticker-option"
                      onClick={() => {
                        handleSymbolSelect(ticker);
                        dispatch(setSearchQuery(''));
                      }}
                    >
                      {ticker}
                    </div>
                  ))
                ) : (
                  <div className="ticker-option">No tickers found</div>
                )}
              </div>
            )}
          </div>
          <div className="symbol-info">
            <span className="symbol">{symbol}</span>
            <button onClick={handleRefresh} className="refresh-button">
              Refresh
            </button>
          </div>
        </div>
      </header>
      
      {marketSentiment && (
        <div className="market-sentiment-container">
          <div className="market-sentiment-summary">
            <div className="sentiment-metric">
              <div className="metric-value" style={{ color: marketSentiment.sentimentColor }}>
                {marketSentiment.avgScore}%
              </div>
              <div className="metric-label">Sentiment Score</div>
            </div>
          <div className="sentiment-metric">
            <div className="metric-value" style={{ color: '#4CAF50' }}>
              {marketSentiment.totalBullish} <span style={{ fontSize: '0.8em' }}>🐂</span>
            </div>
            <div className="metric-label">Bullish Signals</div>
          </div>
          <div className="sentiment-metric">
            <div className="metric-value" style={{ color: '#F44336' }}>
              {marketSentiment.totalBearish} <span style={{ fontSize: '0.8em' }}>🐻</span>
            </div>
            <div className="metric-label">Bearish Signals</div>
          </div>
          <div className="sentiment-metric">
            <div className="metric-value">
              {marketSentiment.totalTraders}
            </div>
            <div className="metric-label">Active Traders</div>
          </div>
        </div>
        
        {/* Detailed Sentiment Analysis */}
        <div className="sentiment-details" style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '20px', 
          margin: '20px 0',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>Market Sentiment Analysis</h3>
          
          {/* Summary */}
          <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            <p><strong>Overall Sentiment:</strong> {marketSentiment.sentimentSummary}</p>
          </div>
          
          {/* Bullish Reasons */}
          {marketSentiment.topBullishReasons.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#4CAF50', marginBottom: '10px' }}>Key Bullish Factors</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {marketSentiment.topBullishReasons.map((reason, i) => (
                  <li key={`bullish-${i}`} style={{ marginBottom: '5px' }}>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Bearish Reasons */}
          {marketSentiment.topBearishReasons.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#F44336', marginBottom: '10px' }}>Key Bearish Factors</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {marketSentiment.topBearishReasons.map((reason, i) => (
                  <li key={`bearish-${i}`} style={{ marginBottom: '5px' }}>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Mentioned Events */}
          {marketSentiment.mentionedEvents.length > 0 && (
            <div>
              <h4 style={{ color: '#2196F3', marginBottom: '10px' }}>Mentioned Events</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {marketSentiment.mentionedEvents.map((event, i) => (
                  <li key={`event-${i}`} style={{ marginBottom: '5px' }}>
                    {event}
                  </li>
                ))}
              </ul>
            </div>
          )}
          </div>
        </div>
      )}

      <div className="messages-container">
        {messagesWithUserStats.length === 0 ? (
          <div className="no-messages">
            <p>No trending messages found for {symbol}</p>
          </div>
        ) : (
          <div className="messages-grid">
            {messagesWithUserStats.map(({ message, userStats }) => (
              <div key={message.id} className="message-card">
                <div className="message-header">
                  <div className="user-info">
                    <img
                      src={message.user.avatar_url}
                      alt={message.user.username}
                      className="avatar"
                    />
                    <div className="user-details">
                      <div className="user-name-row">
                        <h3>{message.user.name}</h3>
                        <div 
                          className="prediction-score" 
                          style={{
                            backgroundColor: getScoreColor(userStats.predictionScore),
                            color: getTextColor(userStats.predictionScore)
                          }}
                        >
                          {userStats.predictionScore}%
                        </div>
                      </div>
                      <span className="username">@{message.user.username}</span>
                      <div className="user-stats">
                        <div className="stats-row">
                          <span className="followers-chip" title="Followers">
                            👥 {message.user.followers?.toLocaleString() ?? '—'}
                          </span>
                          <span className="tweet-stats" title="Tweets in last 60 days">
                            ✍️ {userStats.totalTweets}
                          </span>
                        </div>
                        <div className="stats-row" style={{ marginTop: '4px' }}>
                          <span className="sentiment-chip bullish" title="Bullish tweets (last 60 days)">
                            🐂 {userStats.bullishTweets}
                          </span>
                          <span className="sentiment-chip bearish" title="Bearish tweets (last 60 days)">
                            🐻 {userStats.bearishTweets}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const sentimentBasic =
                      message.entities?.sentiment?.basic ?? message.sentiment?.basic ?? 'Neutral';
                    return (
                      <div
                        className="sentiment"
                        style={{ color: getSentimentColor(sentimentBasic) }}
                      >
                        {sentimentBasic}
                      </div>
                    );
                  })()}
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
