# SEO Image Renamer — Gemini AI

SEO Image Renamer è un'applicazione desktop sviluppata in Python con interfaccia grafica (GUI) in Tkinter. Utilizza l'intelligenza artificiale di Google (Gemini API) per analizzare le tue immagini e generare automaticamente nomi file ottimizzati per la SEO e testi alternativi (Alt Text) pertinenti.

## 🌟 Funzionalità

- **Interfaccia Grafica Intuitiva**: Design chiaro e moderno, facile da utilizzare senza conoscenze tecniche.
- **Supporto Multiplo**: Puoi analizzare immagini provenienti da una **cartella locale** oppure indicando gli **URL diretti** delle immagini sul web.
- **Personalizzazione SEO**: Inserisci le keyword del cliente e, opzionalmente, il link del sito web per fornire un contesto mirato all'Intelligenza Artificiale.
- **Riconoscimento Visivo Intelligente**: Utilizzando Gemini, l'applicazione "guarda" l'immagine e formula un nome file (es. `nome-file-seo.jpg`) e un attributo un Alt Text ideali.
- **Gestione Duplicati**: Aggiunge automaticamente un suffisso incrementale per evitare di sovrascrivere immagini qualora vengano generati nomi uguali.
- **Esportazione Flessibile**: Puoi salvare i risultati dell'analisi come report in formato **CSV** oppure scaricare direttamente un archivio **ZIP** con tutte le foto fisicamente già rinominate.

## 📋 Prerequisiti

Per eseguire l'applicazione assicurati di avere installato:
- **Python 3.8 o superiore**
- Una **chiave API valida** di Google Gemini (ottenibile gratuitamente su [Google AI Studio](https://aistudio.google.com/)).

## 🚀 Installazione

1. Posizionati nella directory contenente il file `seo_image_renamer.py`.
2. Apri il prompt dei comandi o il terminale in questa cartella.
3. Installa i pacchetti Python necessari (librerie esterne) con questo comando:
   ```bash
   pip install requests pillow google-generativeai
   ```
*(Nota: la GUI è basata su `tkinter`, che in genere è già preinstallato con Python su Windows. Le altre librerie come `json`, `csv`, `zipfile`, e `threading` fanno parte della standard library di Python).*

## 💻 Come Utilizzare l'Applicazione

1. Avvia il programma eseguendo il file da terminale:
   ```bash
   python seo_image_renamer.py
   ```
2. **Configurazione Iniziale**: Inserisci la tua **API Key Gemini** nel campo apposito (obbligatorio). Se lo desideri, puoi aggiungere anche il link del sito web (opzionale).
3. **Keyword**: Specifica le parole chiave target su cui intendi concentrarti per la SEO (una per riga, o separate da virgola).
4. **Input Immagini**: 
   - Clicca su **"Sfoglia..."** per selezionare una cartella nel tuo computer contenente le immagini da ottimizzare.
   - *Oppure* incolla uno o più **URL** di immagini online nell'area testo di destra.
   - Formati supportati: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`.
5. Fai clic su **"🚀 Avvia Analisi"**. 
6. Attendi l'elaborazione. L'andamento sarà visibile nella barra di caricamento e nel log testuale a schermo. I risultati appariranno a fine processo nella tabella centrale.
7. **Esportazione**:
   - Clicca **"Scarica CSV"** per salvare una tabella riassuntiva (Nome Originale, Nuovo Nome SEO, Alt Text).
   - Clicca **"Scarica ZIP"** per comprimere e scaricare tutte le immagini elaborate e già modificate con il loro nuovo nome ottimizzato.

## ⚠️ Note

- **Limiti di Rete (Rate Limit / Errori 429)**: Se l'API restituisce un errore dovuto al superamento della quota (limite di richieste della versione gratuita), il programma inserirà un ritardo automatico di 30 secondi e tenterà di nuovo la richiesta (fino a 3 tentativi) prima di saltare l'immagine.
- **Dimensioni File**: Per ottimizzare le chiamate cloud (sia nei tempi che nel consumo di token delle API), le immagini locali e quelle scaricate dagli URL vengono internamente convertite e ridimensionate (in memoria) a un formato ridotto (800x800px formato JPEG) solo prima di inviarle per l'analisi. Nello scaricare l'archivio ZIP, le immagini originarie *non subiscono riduzioni* qualitative; viene applicata solo la rinominazione.
