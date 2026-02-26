# Audio Files for Queue Display Voice System

Place .mp3 audio files in the following structure:

## Root
- `bel.mp3` ← Bell / chime sound played before every announcement

## Language Folders
Each language folder (`id/`, `en/`, `local/`) must contain:

### Number files: `001.mp3` to `999.mp3`
- `id/` → Indonesian: "Satu", "Dua", "Tiga", ...
- `en/` → English: "One", "Two", "Three", ...
- `local/` → Regional (Sunda/Jawa): "Hiji/Siji", "Dua/Loro", "Tilu/Telu", ...

### Loket files: `loket_1.mp3` to `loket_4.mp3`
- `id/` → "Loket Satu", "Loket Dua", "Loket Tiga", "Loket Empat"
- `en/` → "Counter One", "Counter Two", "Counter Three", "Counter Four"
- `local/` → "Loket Hiji/Siji", "Loket Dua/Loro", "Loket Tilu/Telu", "Loket Opat/Papat"

## Notes
- If a file is missing, that step is silently skipped.
- If ALL files for a language are missing, browser SpeechSynthesis (text-to-speech) is used as fallback.
- Languages cycle: ID → EN → Local → ID → … on each new queue call.
