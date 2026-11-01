<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Nexora architecture
- User data is read/written from the browser via the Supabase client with per-user RLS (`user_id = auth.uid()`); why: simple, isolated per user.
- Job search, AI (match, resume) and account deletion live in `src/lib/nexora.functions.ts` server functions; why: keep API keys and prompts server-side.
- Job sources: Remotive (no key) and Adzuna Brasil (needs ADZUNA_APP_ID/ADZUNA_APP_KEY secrets); a missing source is reported, never faked.
- Resumes are stored as plain text (#/##/###/-) and exported via browser print for selectable, single-column ATS PDFs.
