# Traces

Observability configuration for agent sessions.

## Enabling Tracing

1. Edit `otel-stub.yaml` and uncomment the relevant sections
2. Set your OTLP endpoint
3. Set `OTEL_EXPORTER_OTLP_ENDPOINT` env var or configure in `.claude/settings.json`

## What to Instrument

Follow [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/):
- Each tool call → one span
- Each agent turn → one parent span
- Token counts as span attributes

## Warning

Do not enable `capture_message_content: true` in production if the project handles PII.
