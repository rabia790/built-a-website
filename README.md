# AI Website Builder

AI Website Builder is a Next.js App Router app that turns a plain-English prompt into a React/Tailwind website. It uses the Vercel AI SDK with Groq for generation and edits, a lightweight iframe for the live preview and code viewer, and Supabase for saving generated projects.

## Stack

- Next.js App Router
- JavaScript
- React
- Tailwind CSS
- Vercel AI SDK
- Groq
- iframe preview
- Supabase
- Lucide React

## Install

```bash
npm install
```

## Environment Variables

Create `.env.local` in the project root:

```bash
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The Supabase keys are optional for generation and editing. Saving projects requires them.

## Run Locally

```bash
npm run dev
```

Open the local URL shown in your terminal, usually `http://localhost:3000`.

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run the SQL in `supabase/schema.sql`.
4. Add your project URL and anon key to `.env.local`.

The schema creates:

- `projects`
- `project_files`
- development RLS policies for select, insert, update, and delete
- `updated_at` triggers

## How To Test

1. Start the app with `npm run dev`.
2. Enter a prompt such as:

```text
Build a modern landing page for a wedding photographer in Toronto
```

3. Click `Generate Website`.
4. Review the live iframe preview and code viewer.
5. Enter an edit instruction such as:

```text
Make the hero more luxury and add three premium packages
```

6. Click `Apply Edit`.
7. Configure Supabase, then click `Save Project`.

## Notes

- Generated files are expected to include `/App.js` and `/styles.css`.
- The generated website code should not import external packages.
- If Groq is not configured, the app shows a friendly setup error.
- If Supabase is not configured, saving shows: `Supabase is not configured yet. Add your keys in .env.local.`
