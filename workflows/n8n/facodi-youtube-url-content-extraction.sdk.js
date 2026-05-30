import { workflow, node, trigger, ifElse, sticky, expr } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook - YouTube Analyze',
    parameters: {
      httpMethod: 'POST',
      path: 'facodi/youtube/analyze',
      responseMode: 'responseNode',
      options: {},
    },
  },
});

const validateRequest = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Validate Request',
    parameters: {
      jsCode:
        "const body = $json.body ?? $json;\n" +
        "const secret = $json.headers?.['x-n8n-webhook-secret'] ?? $json.headers?.['X-N8N-Webhook-Secret'];\n" +
        "if ($env.N8N_WEBHOOK_SECRET && secret !== $env.N8N_WEBHOOK_SECRET) throw new Error('unauthorized');\n" +
        "const youtubeUrl = String(body.youtube_url ?? body.youtubeUrl ?? '').trim();\n" +
        "if (!youtubeUrl) throw new Error('youtube_url is required');\n" +
        "return [{ json: {\n" +
        "  youtube_url: youtubeUrl,\n" +
        "  language: String(body.language ?? 'pt').slice(0, 12).toLowerCase(),\n" +
        "  user_id: body.user_id ?? body.userId ?? null,\n" +
        "  source: String(body.source ?? 'n8n_youtube_url_import'),\n" +
        "  force_reprocess: Boolean(body.force_reprocess ?? body.forceReprocess ?? false)\n" +
        "} }];",
    },
  },
});

const fetchYoutubeMetadata = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch YouTube Metadata',
    parameters: {
      method: 'GET',
      url: expr("{{ 'https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent($json.youtube_url) }}"),
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'user-agent', value: 'Mozilla/5.0 (compatible; FACODI-n8n/1.0)' },
          { name: 'accept-language', value: 'pt-PT,pt;q=0.9,en;q=0.8' },
        ],
      },
      options: { timeout: 10000 },
    },
  },
});

const normalizeMetadata = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Python Normalize Metadata',
    parameters: {
      method: 'POST',
      url: expr('{{ $env.FACODI_PYTHON_HELPER_URL }}'),
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ { ...$("Validate Request").first().json, metadata: $json } }}'),
      options: { timeout: 30000 },
    },
  },
});

const upsertVideo = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Upsert Supabase Video',
    parameters: {
      method: 'POST',
      url: expr("{{ $env.SUPABASE_URL + '/rest/v1/videos?on_conflict=youtube_id' }}"),
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'apikey', value: expr('{{ $env.SUPABASE_SERVICE_ROLE_KEY }}') },
          { name: 'Authorization', value: expr("{{ 'Bearer ' + $env.SUPABASE_SERVICE_ROLE_KEY }}") },
          { name: 'Prefer', value: 'resolution=merge-duplicates,return=representation' },
        ],
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ $json.rows.video_upsert }}'),
      options: {},
    },
  },
});

const loadPlaylists = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Load Education Playlists',
    parameters: {
      method: 'POST',
      url: expr("{{ $env.SUPABASE_URL + '/rest/v1/rpc/list_education_playlists_for_assignment' }}"),
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'apikey', value: expr('{{ $env.SUPABASE_SERVICE_ROLE_KEY }}') },
          { name: 'Authorization', value: expr("{{ 'Bearer ' + $env.SUPABASE_SERVICE_ROLE_KEY }}") },
        ],
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ { p_language: $("Validate Request").first().json.language, p_limit: 160 } }}'),
      options: {},
    },
  },
});

const openAiEnrichment = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'OpenAI Enrichment',
    parameters: {
      method: 'POST',
      url: 'https://api.openai.com/v1/chat/completions',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Authorization', value: expr("{{ 'Bearer ' + $env.OPENAI_API_KEY }}") },
          { name: 'Content-Type', value: 'application/json' },
        ],
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr(
        "{{ { model: $env.OPENAI_MODEL || 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [ { role: 'system', content: 'Return only valid JSON for FACODI educational video enrichment.' }, { role: 'user', content: JSON.stringify({ request: $('Validate Request').first().json, metadata: $('Fetch YouTube Metadata').first().json, playlists: $json }) } ] } }}",
      ),
      options: { timeout: 30000 },
    },
  },
});

const finalizeAnalysis = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Python Finalize Analysis',
    parameters: {
      method: 'POST',
      url: expr('{{ $env.FACODI_PYTHON_HELPER_URL }}'),
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr(
        "{{ { ...$('Validate Request').first().json, metadata: $('Fetch YouTube Metadata').first().json, playlists: $('Load Education Playlists').first().json, video_id: $('Upsert Supabase Video').first().json[0]?.id ?? $('Upsert Supabase Video').first().json.id, ai_response: $json.choices?.[0]?.message?.content } }}",
      ),
      options: { timeout: 30000 },
    },
  },
});

const insertAiEnrichment = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Insert AI Enrichment',
    parameters: {
      method: 'POST',
      url: expr("{{ $env.SUPABASE_URL + '/rest/v1/ai_enrichments' }}"),
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'apikey', value: expr('{{ $env.SUPABASE_SERVICE_ROLE_KEY }}') },
          { name: 'Authorization', value: expr("{{ 'Bearer ' + $env.SUPABASE_SERVICE_ROLE_KEY }}") },
          { name: 'Prefer', value: 'return=representation' },
        ],
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ $json.rows.ai_enrichment }}'),
      options: {},
    },
  },
});

const hasPlaylistAssignment = ifElse({
  version: 2.2,
  config: {
    name: 'Has Playlist Assignment',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [
          {
            leftValue: expr("{{ $('Python Finalize Analysis').first().json.assignment.assigned_playlist_id }}"),
            operator: { type: 'string', operation: 'notEmpty' },
          },
        ],
        combinator: 'and',
      },
      options: {},
    },
  },
});

const insertPlaylistLink = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Insert Playlist Link',
    parameters: {
      method: 'POST',
      url: expr("{{ $env.SUPABASE_URL + '/rest/v1/playlist_videos?on_conflict=playlist_id,video_id' }}"),
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'apikey', value: expr('{{ $env.SUPABASE_SERVICE_ROLE_KEY }}') },
          { name: 'Authorization', value: expr("{{ 'Bearer ' + $env.SUPABASE_SERVICE_ROLE_KEY }}") },
          { name: 'Prefer', value: 'resolution=ignore-duplicates,return=minimal' },
        ],
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr("{{ $('Python Finalize Analysis').first().json.rows.playlist_video }}"),
      options: {},
    },
  },
});

const respondSuccess = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond Success',
    parameters: {
      respondWith: 'json',
      responseBody: expr("{{ $('Python Finalize Analysis').first().json.response }}"),
      options: {},
    },
  },
});

const implementationNote = sticky(
  '## FACODI YouTube URL extraction\nThis workflow is inactive by default. Configure FACODI_PYTHON_HELPER_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, and N8N_WEBHOOK_SECRET before testing.',
  [webhookTrigger, respondSuccess],
  { color: 3 },
);

export default workflow('facodi-youtube-url-content-extraction', 'facodi-youtube-url-content-extraction')
  .add(implementationNote)
  .add(webhookTrigger)
  .to(validateRequest)
  .to(fetchYoutubeMetadata)
  .to(normalizeMetadata)
  .to(upsertVideo)
  .to(loadPlaylists)
  .to(openAiEnrichment)
  .to(finalizeAnalysis)
  .to(insertAiEnrichment)
  .to(hasPlaylistAssignment
    .onTrue(insertPlaylistLink.to(respondSuccess))
    .onFalse(respondSuccess));
