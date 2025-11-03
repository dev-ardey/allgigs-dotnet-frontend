# Backend Fix voor "No fields to update" Error

## Probleem
De error "No fields to update" komt waarschijnlijk van de backend wanneer deze probeert een `interviews` array te updaten maar de backend:
1. Null/empty values filtert uit de update request
2. De interviews array niet correct serialiseert naar JSON voor Supabase
3. De update request als "leeg" beschouwt

## Oplossing voor Backend

### 1. Check `ApplyingService.cs` - `UpdateApplicationAsync` method

Het probleem zit waarschijnlijk hier:

```csharp
public async Task<ApplyingDto> UpdateApplicationAsync(string applyingId, UpdateApplyingRequest request)
{
    // PROBLEEM: Als request alleen { interviews: [...] } bevat,
    // kan de backend dit als "geen velden" zien
    
    // OPLOSSING: Zorg dat interviews altijd wordt meegegeven, zelfs als het null is
    var updateData = new Dictionary<string, object>();
    
    // Voeg ALLE velden toe, niet alleen non-null velden
    if (request.Interviews != null)
    {
        updateData["interviews"] = request.Interviews; // Dit is al een array
    }
    
    // Andere velden...
    if (request.Contacts != null)
    {
        updateData["contacts"] = request.Contacts;
    }
    
    // BELANGRIJK: Serialiseer interviews naar JSON string voor Supabase
    var jsonOptions = new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };
    
    // Maak het update object voor Supabase
    var supabaseUpdate = new Dictionary<string, object>();
    
    if (request.Interviews != null)
    {
        // Serialiseer naar JSON string
        supabaseUpdate["interviews"] = JsonSerializer.Serialize(request.Interviews, jsonOptions);
    }
    
    if (request.Contacts != null)
    {
        supabaseUpdate["contacts"] = JsonSerializer.Serialize(request.Contacts, jsonOptions);
    }
    
    // Voeg andere velden toe...
    // ... rest van je update logica
}
```

### 2. Check `UpdateApplyingRequest` DTO

Zorg dat de DTO correct is:

```csharp
public class UpdateApplyingRequest
{
    // ... andere velden ...
    
    [JsonPropertyName("interviews")]
    public List<InterviewDto>? Interviews { get; set; }
    
    [JsonPropertyName("contacts")]
    public List<ContactDto>? Contacts { get; set; }
}

public class InterviewDto
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }
    
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;
    
    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;
    
    [JsonPropertyName("rating")]
    public bool? Rating { get; set; }
    
    [JsonPropertyName("completed")]
    public bool Completed { get; set; }
    
    [JsonPropertyName("created_at")]
    public string? CreatedAt { get; set; }
}
```

### 3. Check Supabase Update Call

In `ApplyingService.cs`, zorg dat je de update correct doet:

```csharp
// FOUT (waarschijnlijk wat er nu gebeurt):
if (updateData.Count == 0)
{
    return BadRequest("No fields to update");
}

// GOED: Serialiseer JSONB velden correct
var supabaseUpdate = new Dictionary<string, object>();

// Voor interviews (JSONB column in Supabase)
if (request.Interviews != null)
{
    // Serialiseer naar JSON - Supabase verwacht een JSON string of object
    supabaseUpdate["interviews"] = JsonSerializer.Serialize(request.Interviews, new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
}

// Voor contacts (JSONB column)
if (request.Contacts != null)
{
    supabaseUpdate["contacts"] = JsonSerializer.Serialize(request.Contacts, new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
}

// Voor andere string velden
if (!string.IsNullOrEmpty(request.Notes))
{
    supabaseUpdate["notes"] = request.Notes;
}

// Check: zorg dat er altijd iets te updaten is
if (supabaseUpdate.Count == 0)
{
    // Log dit voor debugging
    _logger.LogWarning($"Update request for {applyingId} had no fields to update. Request: {JsonSerializer.Serialize(request)}");
    throw new BadRequestException("No fields to update");
}

// Maak de Supabase HTTP call
var url = $"{_config.SupabaseUrl}/rest/v1/applying?applying_id=eq.{applyingId}";
var content = new StringContent(
    JsonSerializer.Serialize(supabaseUpdate, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }),
    Encoding.UTF8,
    "application/json"
);

var requestMessage = new HttpRequestMessage(HttpMethod.Patch, url)
{
    Content = content
};

requestMessage.Headers.Add("apikey", _config.SupabaseServiceRoleKey);
requestMessage.Headers.Add("Authorization", $"Bearer {_config.SupabaseServiceRoleKey}");
requestMessage.Headers.Add("Prefer", "return=representation");
requestMessage.Headers.Add("Content-Profile", "public");
```

## Debugging Tips

1. **Log de incoming request** in `ApplyingController.cs`:
```csharp
[HttpPut("{applyingId}")]
public async Task<IActionResult> UpdateApplication(string applyingId, [FromBody] UpdateApplyingRequest request)
{
    _logger.LogInformation($"UpdateApplication called with applyingId: {applyingId}");
    _logger.LogInformation($"Request body: {JsonSerializer.Serialize(request)}");
    _logger.LogInformation($"Interviews count: {request.Interviews?.Count ?? 0}");
    
    // ... rest van je code
}
```

2. **Check Railway logs** om te zien wat de backend ontvangt

3. **Test met Postman/curl**:
```bash
curl -X PUT https://allgigs-v3-backend-production.up.railway.app/api/applying/YOUR_APPLYING_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interviews": [
      {
        "id": "test-id",
        "type": "recruiter",
        "date": "2025-11-06",
        "rating": true,
        "completed": true,
        "created_at": "2025-11-02T18:09:31.194Z"
      }
    ]
  }'
```

## Meest Waarschijnlijke Fix

Het probleem is waarschijnlijk dat de backend:
1. De `interviews` array niet correct deserialiseert uit de JSON request
2. De `interviews` array niet correct serialiseert naar JSON voor Supabase
3. Null checks doet die de `interviews` array filteren

**Fix**: Zorg dat in `UpdateApplicationAsync`:
- Je de `interviews` array altijd meeneemt als deze is meegegeven
- Je deze correct serialiseert naar JSON voor Supabase
- Je logging toevoegt om te zien wat er binnenkomt en wordt verstuurd

