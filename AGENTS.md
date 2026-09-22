# FRACTUS Contributor Notes

FRACTUS is a local, camera-based adaptive-perception prototype. Never describe its camera output as LiDAR or its estimated depth as ground-truth physical range.

Keep `frontend/src/types/contracts.ts` aligned with `backend/app/schemas/contracts.py`. The demo path must remain dependency-light and deterministic. New measured metrics must come directly from the pipeline; otherwise return `null` and label the value unavailable.
