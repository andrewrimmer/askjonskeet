using System.Net;
using AskJonSkeet.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<SearchService>();
builder.Services.AddHostedService<IndexingService>();
builder.Services.AddHttpClient("StackExchange", client =>
    {
        client.DefaultRequestHeaders.Add("User-Agent", "AskJonSkeet/2.0");
        client.DefaultRequestHeaders.Add("Accept", "application/json");
    })
    .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
    {
        AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate
    });

var app = builder.Build();

// Serve the React app from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

// Search API endpoint
app.MapGet("/api/search", (string? q, SearchService search) =>
{
    if (string.IsNullOrWhiteSpace(q))
        return Results.BadRequest(new { error = "Query parameter 'q' is required" });

    var results = search.Search(q.Trim());
    return Results.Ok(results);
});

// Latest answers endpoint (returns most recent by creation date)
app.MapGet("/api/latest", (SearchService search) =>
{
    var results = search.GetLatest(20);
    return Results.Ok(results);
});

// SPA fallback - serve index.html for client-side routes
app.MapFallbackToFile("index.html");

app.Run();
