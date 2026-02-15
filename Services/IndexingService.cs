using System.Text.Json;
using Lucene.Net.Index;

namespace AskJonSkeet.Services;

public class IndexingService : BackgroundService
{
    private const int SkeetUserId = 22656;
    private const int PageSize = 100;
    private const string ApiBase = "https://api.stackexchange.com/2.3";
    private const string ApiKey = "rl_1fDhKMfngSSkHKvqUeu4eAApE";

    private readonly SearchService _search;
    private readonly ILogger<IndexingService> _logger;
    private readonly HttpClient _http;
    private readonly TimeSpan _incrementalInterval;
    private readonly TimeSpan _fullRebuildInterval;

    private DateTime _lastFullRebuild = DateTime.MinValue;

    public IndexingService(
        SearchService search,
        ILogger<IndexingService> logger,
        IHttpClientFactory httpFactory,
        IConfiguration config)
    {
        _search = search;
        _logger = logger;
        _http = httpFactory.CreateClient("StackExchange");
        _incrementalInterval = TimeSpan.FromHours(
            config.GetValue<double>("Search:IncrementalIntervalHours", 1));
        _fullRebuildInterval = TimeSpan.FromDays(
            config.GetValue<double>("Search:FullRebuildIntervalDays", 7));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Give the app a moment to start up
        await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);

        // On first boot: full build only if no index exists
        if (!_search.IndexExists)
        {
            _logger.LogInformation("No existing index found. Starting full build...");
            await FullRebuild(stoppingToken);
        }
        else
        {
            _logger.LogInformation("Existing index found. Skipping startup indexing; scheduled updates will handle it.");
            _lastFullRebuild = DateTime.UtcNow;
        }

        // Main loop: incremental every hour, full rebuild every week
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(_incrementalInterval, stoppingToken);

            try
            {
                if (DateTime.UtcNow - _lastFullRebuild >= _fullRebuildInterval)
                {
                    await FullRebuild(stoppingToken);
                }
                else
                {
                    await IncrementalUpdate(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Index update failed");
            }
        }
    }

    /// <summary>
    /// Full rebuild: fetches all answers and overwrites every document.
    /// No delete -- UpdateDocument replaces by answerId term.
    /// Refreshes scores, accepted status, etc.
    /// </summary>
    private async Task FullRebuild(CancellationToken ct)
    {
        _logger.LogInformation("Starting full index rebuild...");

        var totalIndexed = await IndexAnswers(fromDate: null, ct);

        _search.CommitAndRefresh();
        _lastFullRebuild = DateTime.UtcNow;
        _logger.LogInformation("Full rebuild complete. {Total} answers indexed.", totalIndexed);
    }

    /// <summary>
    /// Incremental update: fetches only answers created since the newest
    /// answer in the index. Typically 0-5 new answers.
    /// </summary>
    private async Task IncrementalUpdate(CancellationToken ct)
    {
        var newestDate = _search.GetNewestCreationDate();
        if (newestDate == 0)
        {
            _logger.LogWarning("No creation date found in index. Falling back to full rebuild.");
            await FullRebuild(ct);
            return;
        }

        _logger.LogInformation("Incremental update from {Date}...",
            DateTimeOffset.FromUnixTimeSeconds(newestDate).ToString("yyyy-MM-dd HH:mm"));

        var totalIndexed = await IndexAnswers(fromDate: newestDate, ct);

        _search.CommitAndRefresh();
        _logger.LogInformation("Incremental update complete. {Total} answers added/updated.", totalIndexed);
    }

    /// <summary>
    /// Core indexing loop. If fromDate is null, fetches all answers.
    /// If fromDate is set, fetches only answers created after that date.
    /// Uses UpdateDocument so existing docs are replaced, not duplicated.
    /// </summary>
    private async Task<int> IndexAnswers(long? fromDate, CancellationToken ct)
    {
        var writer = _search.GetWriter();
        var page = 1;
        var totalIndexed = 0;
        var hasMore = true;

        while (hasMore && !ct.IsCancellationRequested)
        {
            var answers = await FetchAnswersPage(page, fromDate, ct);
            if (answers == null || answers.Items.Count == 0)
                break;

            hasMore = answers.HasMore;

            var questionIds = answers.Items
                .Select(a => a.QuestionId)
                .Distinct()
                .ToList();

            var questions = await FetchQuestions(questionIds, ct);
            var questionMap = questions.ToDictionary(q => q.QuestionId);

            foreach (var answer in answers.Items)
            {
                questionMap.TryGetValue(answer.QuestionId, out var question);

                var doc = _search.CreateDocument(
                    answerId: answer.AnswerId,
                    questionId: answer.QuestionId,
                    title: question?.Title ?? answer.Title ?? "",
                    tags: question?.Tags ?? [],
                    questionBody: question?.Body ?? "",
                    answerBody: answer.Body ?? "",
                    score: answer.Score,
                    isAccepted: answer.IsAccepted,
                    creationDate: answer.CreationDate
                );

                writer.UpdateDocument(
                    new Term("answerId", answer.AnswerId.ToString()),
                    doc);

                totalIndexed++;
            }

            _logger.LogInformation("Indexed page {Page} ({Total} answers so far)", page, totalIndexed);
            page++;

            // Respect rate limits
            await Task.Delay(100, ct);
        }

        return totalIndexed;
    }

    private async Task<ApiResponse<AnswerItem>?> FetchAnswersPage(
        int page, long? fromDate, CancellationToken ct)
    {
        var url = $"{ApiBase}/users/{SkeetUserId}/answers"
            + $"?page={page}&pagesize={PageSize}&order=desc&sort=creation"
            + $"&site=stackoverflow&filter=withbody&key={ApiKey}";

        if (fromDate.HasValue)
            url += $"&fromdate={fromDate.Value}";

        return await FetchApi<ApiResponse<AnswerItem>>(url, ct);
    }

    private async Task<List<QuestionItem>> FetchQuestions(List<int> ids, CancellationToken ct)
    {
        if (ids.Count == 0) return [];

        var results = new List<QuestionItem>();

        foreach (var batch in ids.Chunk(100))
        {
            var idStr = string.Join(";", batch);
            var url = $"{ApiBase}/questions/{idStr}"
                + $"?pagesize=100&site=stackoverflow&filter=withbody&key={ApiKey}";

            var response = await FetchApi<ApiResponse<QuestionItem>>(url, ct);
            if (response?.Items != null)
                results.AddRange(response.Items);

            await Task.Delay(100, ct);
        }

        return results;
    }

    private async Task<T?> FetchApi<T>(string url, CancellationToken ct)
    {
        var response = await _http.GetAsync(url, ct);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("SE API {Status}: {Body}", (int)response.StatusCode, errorBody);
            response.EnsureSuccessStatusCode();
        }

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        return await JsonSerializer.DeserializeAsync<T>(stream, JsonOptions, ct);
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };
}

// SE API models

public class ApiResponse<T>
{
    public List<T> Items { get; set; } = [];
    public bool HasMore { get; set; }
    public int QuotaRemaining { get; set; }
}

public class AnswerItem
{
    public int AnswerId { get; set; }
    public int QuestionId { get; set; }
    public string? Title { get; set; }
    public string? Body { get; set; }
    public int Score { get; set; }
    public bool IsAccepted { get; set; }
    public long CreationDate { get; set; }
}

public class QuestionItem
{
    public int QuestionId { get; set; }
    public string Title { get; set; } = "";
    public string? Body { get; set; }
    public string[] Tags { get; set; } = [];
}
