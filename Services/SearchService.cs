using Lucene.Net.Analysis.Standard;
using Lucene.Net.Documents;
using Lucene.Net.Index;
using Lucene.Net.QueryParsers.Classic;
using Lucene.Net.Search;
using Lucene.Net.Store;
using Lucene.Net.Util;

namespace AskJonSkeet.Services;

public record SearchResult(
    int AnswerId,
    int QuestionId,
    string Title,
    string[] Tags,
    string Excerpt,
    int Score,
    bool IsAccepted,
    long CreationDate
);

public record SearchResponse(
    List<SearchResult> Items,
    int Total
);

public class SearchService : IDisposable
{
    private const LuceneVersion AppLuceneVersion = LuceneVersion.LUCENE_48;
    private readonly string _indexPath;
    private FSDirectory? _directory;
    private IndexWriter? _writer;
    private SearcherManager? _searcherManager;
    private readonly object _lock = new();

    public SearchService(IConfiguration config)
    {
        _indexPath = config.GetValue<string>("Search:IndexPath")
            ?? Path.Combine(AppContext.BaseDirectory, "lucene-index");
    }

    public bool IndexExists => System.IO.Directory.Exists(_indexPath)
        && System.IO.Directory.GetFiles(_indexPath, "segments*").Length > 0;

    private FSDirectory GetDirectory()
    {
        if (_directory == null)
        {
            System.IO.Directory.CreateDirectory(_indexPath);
            _directory = FSDirectory.Open(_indexPath);
        }
        return _directory;
    }

    public IndexWriter GetWriter()
    {
        if (_writer == null)
        {
            var analyzer = new StandardAnalyzer(AppLuceneVersion);
            var config = new IndexWriterConfig(AppLuceneVersion, analyzer)
            {
                OpenMode = OpenMode.CREATE_OR_APPEND
            };
            _writer = new IndexWriter(GetDirectory(), config);
        }
        return _writer;
    }

    public void CommitAndRefresh()
    {
        lock (_lock)
        {
            _writer?.Commit();
            if (_searcherManager != null)
            {
                _searcherManager.MaybeRefresh();
            }
            else if (IndexExists)
            {
                _searcherManager = new SearcherManager(GetDirectory(), null);
            }
        }
    }

    public void EnsureSearcherReady()
    {
        lock (_lock)
        {
            if (_searcherManager == null && IndexExists)
            {
                _searcherManager = new SearcherManager(GetDirectory(), null);
            }
        }
    }

    public SearchResponse Search(string query, int maxResults = 30)
    {
        EnsureSearcherReady();

        if (_searcherManager == null)
            return new SearchResponse([], 0);

        var searcher = _searcherManager.Acquire();
        try
        {
            var analyzer = new StandardAnalyzer(AppLuceneVersion);
            var parser = new MultiFieldQueryParser(
                AppLuceneVersion,
                ["title", "questionBody", "answerBody", "tags"],
                analyzer,
                new Dictionary<string, float>
                {
                    { "title", 3.0f },
                    { "tags", 2.5f },
                    { "answerBody", 1.5f },
                    { "questionBody", 1.0f }
                }
            );
            parser.DefaultOperator = Operator.OR;

            Query parsed;
            try
            {
                parsed = parser.Parse(QueryParserBase.Escape(query));
            }
            catch
            {
                parsed = parser.Parse(QueryParserBase.Escape(query));
            }

            var topDocs = searcher.Search(parsed, maxResults);
            var results = new List<SearchResult>();

            foreach (var scoreDoc in topDocs.ScoreDocs)
            {
                var doc = searcher.Doc(scoreDoc.Doc);
                results.Add(new SearchResult(
                    AnswerId: int.Parse(doc.Get("answerId")),
                    QuestionId: int.Parse(doc.Get("questionId")),
                    Title: doc.Get("title"),
                    Tags: doc.Get("tags")?.Split(',', StringSplitOptions.RemoveEmptyEntries) ?? [],
                    Excerpt: GetExcerpt(doc.Get("answerBody"), 200),
                    Score: int.Parse(doc.Get("score") ?? "0"),
                    IsAccepted: doc.Get("isAccepted") == "1",
                    CreationDate: long.Parse(doc.Get("creationDate") ?? "0")
                ));
            }

            return new SearchResponse(results, topDocs.TotalHits);
        }
        finally
        {
            _searcherManager.Release(searcher);
        }
    }

    public SearchResponse GetLatest(int maxResults = 20)
    {
        EnsureSearcherReady();

        if (_searcherManager == null)
            return new SearchResponse([], 0);

        var searcher = _searcherManager.Acquire();
        try
        {
            var query = new MatchAllDocsQuery();
            var sort = new Sort(new SortField("creationDateSort", SortFieldType.INT64, true));
            var topDocs = searcher.Search(query, maxResults, sort);
            var results = new List<SearchResult>();

            foreach (var scoreDoc in topDocs.ScoreDocs)
            {
                var doc = searcher.Doc(scoreDoc.Doc);
                results.Add(new SearchResult(
                    AnswerId: int.Parse(doc.Get("answerId")),
                    QuestionId: int.Parse(doc.Get("questionId")),
                    Title: doc.Get("title"),
                    Tags: doc.Get("tags")?.Split(',', StringSplitOptions.RemoveEmptyEntries) ?? [],
                    Excerpt: GetExcerpt(doc.Get("answerBody"), 200),
                    Score: int.Parse(doc.Get("score") ?? "0"),
                    IsAccepted: doc.Get("isAccepted") == "1",
                    CreationDate: long.Parse(doc.Get("creationDate") ?? "0")
                ));
            }

            return new SearchResponse(results, topDocs.TotalHits);
        }
        finally
        {
            _searcherManager.Release(searcher);
        }
    }

    public long GetNewestCreationDate()
    {
        EnsureSearcherReady();

        if (_searcherManager == null)
            return 0;

        var searcher = _searcherManager.Acquire();
        try
        {
            var sort = new Sort(new SortField("creationDateSort", SortFieldType.INT64, true));
            var topDocs = searcher.Search(new MatchAllDocsQuery(), 1, sort);
            if (topDocs.ScoreDocs.Length == 0)
                return 0;

            var doc = searcher.Doc(topDocs.ScoreDocs[0].Doc);
            return long.Parse(doc.Get("creationDate") ?? "0");
        }
        finally
        {
            _searcherManager.Release(searcher);
        }
    }

    public Document CreateDocument(
        int answerId, int questionId, string title,
        string[] tags, string questionBody, string answerBody,
        int score, bool isAccepted, long creationDate)
    {
        var doc = new Document
        {
            new StringField("answerId", answerId.ToString(), Field.Store.YES),
            new StringField("questionId", questionId.ToString(), Field.Store.YES),
            new TextField("title", title, Field.Store.YES),
            new TextField("tags", string.Join(",", tags), Field.Store.YES),
            new TextField("questionBody", StripHtml(questionBody), Field.Store.NO),
            new TextField("answerBody", StripHtml(answerBody), Field.Store.YES),
            new StringField("score", score.ToString(), Field.Store.YES),
            new StringField("isAccepted", isAccepted ? "1" : "0", Field.Store.YES),
            new StringField("creationDate", creationDate.ToString(), Field.Store.YES),
            new NumericDocValuesField("creationDateSort", creationDate),
        };
        return doc;
    }

    private static string StripHtml(string html)
    {
        if (string.IsNullOrEmpty(html)) return "";
        // Simple HTML strip - good enough for indexing
        var text = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " ");
        text = System.Net.WebUtility.HtmlDecode(text);
        return System.Text.RegularExpressions.Regex.Replace(text, @"\s+", " ").Trim();
    }

    private static string GetExcerpt(string? text, int maxLength)
    {
        if (string.IsNullOrEmpty(text)) return "";
        var plain = StripHtml(text);
        if (plain.Length <= maxLength) return plain;
        return plain[..plain.LastIndexOf(' ', maxLength)] + "...";
    }

    public void Dispose()
    {
        _searcherManager?.Dispose();
        _writer?.Dispose();
        _directory?.Dispose();
    }
}
