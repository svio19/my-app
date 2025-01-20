import React, { useState, useCallback, useEffect } from 'react';
import { Search, Newspaper, Clock, BookmarkPlus, Share2 } from 'lucide-react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ResponseCard = ({ text, onShare, onSave }) => (
  <div className="product-card">
    <div className="product-card-header">
      <h3 className="product-title">Response</h3>
      <div className="product-badges">
        <span className="badge">Claude</span>
      </div>
    </div>
    <div className="product-content">
      <p className="article-excerpt">{text}</p>
      <div className="card-actions">
        <span className="timestamp">
          <Clock size={14} className="icon" />
          {new Date().toLocaleDateString()}
        </span>
        <div className="action-buttons">
          <button 
            className="action-button" 
            title="Save"
            onClick={onSave}
          >
            <BookmarkPlus size={16} />
          </button>
          <button 
            className="action-button" 
            title="Share"
            onClick={onShare}
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const TabButton = ({ active, icon: Icon, label, onClick }) => (
  <button
    className={`tab ${active ? 'active' : ''}`}
    onClick={onClick}
  >
    <Icon className="icon" />
    {label}
  </button>
);

const App = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('response');
  const [savedResponses, setSavedResponses] = useState(() => {
    const saved = localStorage.getItem('savedResponses');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchHistory, setSearchHistory] = useState(() => {
    const history = localStorage.getItem('searchHistory');
    return history ? JSON.parse(history) : [];
  });

  // Save to localStorage whenever savedResponses or searchHistory changes
  useEffect(() => {
    localStorage.setItem('savedResponses', JSON.stringify(savedResponses));
  }, [savedResponses]);

  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const handleStreamResponse = async (reader, decoder, responseText = '') => {
    try {
      const { done, value } = await reader.read();
      if (done) return;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsedChunk = JSON.parse(data);
            if (parsedChunk.type === 'content_block_delta') {
              responseText += parsedChunk.delta?.text || '';
              setResponse(responseText);
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }

      // Recursive call to continue reading the stream
      await handleStreamResponse(reader, decoder, responseText);
    } catch (error) {
      throw new Error('Stream processing failed: ' + error.message);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          systemPrompt: "You are a response engine. Provide clear, direct, one-sentence responses.",
          temperature: 0.7,
          maxTokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      await handleStreamResponse(reader, decoder);

      // Add to history after successful response
      setSearchHistory(prev => [
        { query, timestamp: new Date().toISOString() },
        ...prev.slice(0, 9)
      ]);

    } catch (err) {
      setError(err.message || 'Failed to fetch response');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch();
    }
  };

  const handleSave = useCallback(() => {
    if (response) {
      setSavedResponses(prev => [
        { response, query, timestamp: new Date().toISOString() },
        ...prev
      ]);
    }
  }, [response, query]);

  const handleShare = useCallback(() => {
    if (response) {
      navigator.clipboard.writeText(response)
        .then(() => alert('Response copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
    }
  }, [response]);

  return (
    <div className="container">
      <h1>Search Interface</h1>

      <div className="scan-section">
        <div className="input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your query..."
            disabled={loading}
            className="barcode-input"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="scan-button"
          >
            {loading ? (
              <div className="loading-spinner" />
            ) : (
              <Search className="icon" />
            )}
            Search
          </button>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          {error}
        </div>
      )}

      <div className="tabs">
        <TabButton
          active={activeTab === 'response'}
          icon={Newspaper}
          label="Response"
          onClick={() => setActiveTab('response')}
        />
        <TabButton
          active={activeTab === 'history'}
          icon={Clock}
          label="History"
          onClick={() => setActiveTab('history')}
        />
        <TabButton
          active={activeTab === 'saved'}
          icon={BookmarkPlus}
          label="Saved"
          onClick={() => setActiveTab('saved')}
        />
      </div>

      <div className="tab-content">
        {activeTab === 'response' && (
          <div className="products-grid">
            {response ? (
              <ResponseCard 
                text={response} 
                onShare={handleShare}
                onSave={handleSave}
              />
            ) : (
              <p className="no-data">No response yet</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="products-grid">
            {searchHistory.length > 0 ? (
              searchHistory.map((item, index) => (
                <div key={index} className="history-item">
                  <p>{item.query}</p>
                  <small>{new Date(item.timestamp).toLocaleString()}</small>
                </div>
              ))
            ) : (
              <p className="no-data">No history available</p>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="products-grid">
            {savedResponses.length > 0 ? (
              savedResponses.map((item, index) => (
                <ResponseCard 
                  key={index}
                  text={item.response}
                  onShare={() => navigator.clipboard.writeText(item.response)}
                  onSave={null}
                />
              ))
            ) : (
              <p className="no-data">No saved responses</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;