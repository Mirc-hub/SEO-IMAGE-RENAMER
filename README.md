# SEO Image Renamer — Web App (Next.js)

Versione web app del tool SEO Image Renamer. Utilizza Google Gemini AI per analizzare immagini e generare automaticamente nomi file ottimizzati per la SEO e testi alternativi (Alt Text).

> Cerchi la versione desktop in Python? Passa al branch [`main`](https://github.com/Mirc-hub/SEO-IMAGE-RENAMER/tree/main).

## Funzionalita

- **Upload drag & drop** o inserimento URL immagini (interfaccia a tab)
- **Keyword SEO personalizzabili** e URL sito per contesto
- **Selezione modello Gemini** tramite dropdown (es. Flash Lite, Flash 2.0)
- **Tabella risultati interattiva** con click-to-copy su nomi SEO e alt text
- **Export CSV** della tabella risultati
- **Export ZIP** con le immagini rinominate con i nomi SEO
- **Log in tempo reale** con progresso dell'analisi
- **Gestione duplicati** automatica (suffisso incrementale)
- **Retry automatico** su errori 429 (rate limit) con backoff

## Tech Stack

- Next.js 16 (App Router)
- React + TypeScript
- shadcn/ui + Tailwind CSS
- sharp (image processing server-side)
- @google/generative-ai (Gemini SDK)
- JSZip (generazione ZIP client-side)

## Prerequisiti

- **Node.js 20+**
- Una **chiave API** di Google Gemini ([Google AI Studio](https://aistudio.google.com/))

## Installazione

```bash
npm install
```

Crea il file `.env.local` con la tua API key:

```bash
cp .env.example .env.local
```

Modifica `.env.local` e inserisci la tua chiave:

```
GEMINI_API_KEY=la-tua-chiave-api
```

## Avvio in locale

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

## Deploy su Vercel

1. Collega il repository a [Vercel](https://vercel.com)
2. Seleziona il branch `feat/webapp-nextjs`
3. Aggiungi la variabile d'ambiente `GEMINI_API_KEY` nelle impostazioni del progetto
4. Deploy

## Come funziona

1. Seleziona il **modello Gemini** dal dropdown
2. Inserisci le **keyword SEO** (una per riga o separate da virgola)
3. Carica le immagini tramite **drag & drop** o incolla gli **URL** (uno per riga)
4. Clicca **"Avvia Analisi"** — le immagini vengono analizzate una alla volta con un delay di 4.5s tra le richieste
5. I risultati appaiono in tabella: clicca su un nome SEO o alt text per **copiarlo**
6. Esporta con **"Scarica CSV"** o **"Scarica ZIP (immagini rinominate)"**

## Note

- **Rate Limit**: il delay di 4.5s tra le richieste rispetta il limite free tier di Gemini (~15 req/min). In caso di errore 429, il sistema ritenta automaticamente fino a 3 volte con backoff crescente (30s, 60s, 90s).
- **Qualita immagini**: le immagini vengono ridimensionate a 800x800px e compresse in JPEG solo per l'invio all'API. Lo ZIP contiene le immagini originali con i nuovi nomi.
- **API Key**: la chiave Gemini resta server-side (env variable), non viene mai esposta al client.
- Formati supportati: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`
