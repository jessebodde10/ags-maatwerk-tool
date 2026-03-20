# AGS Maatwerk-naar-Order Tool — Netlify Deployment

## Mappenstructuur

```
ags-netlify/
├── netlify.toml                  ← Netlify configuratie
├── public/
│   └── index.html                ← De tool (frontend)
└── netlify/
    └── functions/
        └── analyse.js            ← Serverless proxy voor Anthropic API
```

## Stappen voor deployment

### 1. Zet de bestanden op GitHub

Maak een nieuwe GitHub repository en upload deze drie bestanden
(netlify.toml, public/index.html, netlify/functions/analyse.js)
met dezelfde mappenstructuur.

### 2. Koppel aan Netlify

- Ga naar app.netlify.com
- Klik "Add new site" → "Import an existing project"
- Kies uw GitHub repository
- Build settings worden automatisch gelezen uit netlify.toml:
  - Publish directory: public
  - Functions directory: netlify/functions
- Klik "Deploy site"

### 3. Voeg de Anthropic API-sleutel toe

Dit is de BELANGRIJKSTE stap — zonder dit werkt de AI-analyse niet.

- Ga in Netlify naar: Site → Site configuration → Environment variables
- Klik "Add a variable"
- Key:   ANTHROPIC_API_KEY
- Value: sk-ant-... (uw Anthropic API-sleutel)
- Klik "Save"
- Ga naar Deploys → "Trigger deploy" → "Deploy site" (herstart nodig na toevoegen variabele)

### 4. Klaar

De tool is nu bereikbaar op uw Netlify-URL, bijv.:
https://ags-maatwerk.netlify.app

U kunt ook een eigen domein koppelen via:
Netlify → Domain management → Add custom domain

## Hoe werkt de beveiliging?

De Anthropic API-sleutel staat NOOIT in de HTML (niet zichtbaar voor gebruikers).
Alle API-aanroepen gaan via netlify/functions/analyse.js op de server.
De browser stuurt alleen de foto naar uw eigen Netlify-functie.

## Kosten

- Netlify hosting: gratis (Starter plan)
- Netlify Functions: gratis tot 125.000 aanroepen/maand
- Anthropic API: ~€0,003 per analyse (Claude Sonnet)
  Bij 100 analyses per dag ≈ €9 per maand

## Problemen?

Check de Netlify function logs via:
Netlify dashboard → Functions → analyse → bekijk logs
