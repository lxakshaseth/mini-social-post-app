function FeedInsights({
  feedFilter,
  searchTerm,
  trendingTopics,
  visibleCount,
  draftSaved,
  characterCount,
  maxCharacters,
}) {
  const filterLabels = {
    all: "Newest first",
    "for-you": "For you ranking",
    "most-liked": "Top liked",
    "most-commented": "Top discussed",
  };

  return (
    <section className="feed-insights card">
      <div className="feed-insights-row">
        <div>
          <p className="eyebrow">Feed Overview</p>
          <h3>{visibleCount} results in view</h3>
        </div>
        <div className="insight-pills">
          <span className="insight-pill">{filterLabels[feedFilter]}</span>
          <span className={`insight-pill ${draftSaved ? "good" : ""}`}>
            {draftSaved ? "Draft saved" : "Draft not saved"}
          </span>
          <span className={`insight-pill ${characterCount > maxCharacters ? "warn" : ""}`}>
            {characterCount}/{maxCharacters} characters
          </span>
        </div>
      </div>

      <div className="feed-insights-row compact">
        <div className="search-result-copy">
          {searchTerm.trim()
            ? `Searching for "${searchTerm.trim()}"`
            : "Search by username, handle, or post content"}
        </div>
        <div className="trending-strip">
          {trendingTopics.length ? (
            trendingTopics.map((topic) => (
              <span key={topic} className="trend-chip">
                {topic}
              </span>
            ))
          ) : (
            <span className="trend-chip muted">No trends yet</span>
          )}
        </div>
      </div>
    </section>
  );
}

export default FeedInsights;
