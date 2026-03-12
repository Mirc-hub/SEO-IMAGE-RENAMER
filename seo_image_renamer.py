"""
SEO Image Renamer — Applicazione Python con GUI Tkinter
Utilizza la Gemini API (gemini-2.0-flash) per rinominare immagini in ottica SEO.
Autore: Antigravity
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import threading
import json
import csv
import os
import io
import re
import time
import zipfile

import requests
from PIL import Image
import google.generativeai as genai

# ────────────────────────────────────────────────────────────
# Estensioni immagine supportate
# ────────────────────────────────────────────────────────────
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

# ────────────────────────────────────────────────────────────
# System Prompt SEO (template)
# ────────────────────────────────────────────────────────────
SYSTEM_PROMPT_TEMPLATE = """## RUOLO
Sei un esperto SEO specializzato in ottimizzazione delle immagini per il web.
Quando ricevi un'immagine, la analizzi e generi un nome file SEO-friendly
basandoti sui soggetti rilevati e sulle keyword fornite dall'utente.

## PROCESSO
1. Analizza visivamente l'immagine ricevuta
2. Identifica il soggetto principale e gli elementi secondari
3. Considera le keyword del cliente fornite dall'utente
4. Genera il nome file ottimizzato seguendo le regole SEO

## REGOLE PER IL NOME FILE SEO
- Solo lettere minuscole
- Separa le parole con trattini (-), mai underscore o spazi
- Lunghezza ideale: 3-6 parole significative
- Dove possibile, crea pertinenza con le parole chiave o argomenti correlati
- Descrivi il soggetto principale PRIMA delle keyword
- Evita parole generiche come "immagine", "foto", "img", "pic"
- Evita stopword (il, lo, la, di, da, in, ecc.)
- Il nome deve essere descrittivo e leggibile da un umano
- Se ci sono immagini uguali, aggiungi alla fine del nome file un sequenziale numerico. Es: -1, -2
- Mantieni l'estensione originale del file (.jpg, .png, .webp, ecc.)

## CONTESTO CLIENTE
Le keyword del cliente sono: {keywords}
Link sito (se fornito): {site_url}

## OUTPUT
Rispondi SEMPRE e SOLO con un JSON valido, senza testo aggiuntivo, in questo formato:
{{
  "filename": "nome-file-seo.jpg",
  "alt_text": "Breve descr. ALT con keyword (MAX 40 caratteri, sii molto conciso)"
}}"""


# ────────────────────────────────────────────────────────────
# Classe principale dell'applicazione
# ────────────────────────────────────────────────────────────
class SEOImageRenamerApp:
    """Applicazione GUI per rinominare immagini in ottica SEO tramite Gemini API."""

    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("SEO Image Renamer — Gemini AI")
        self.root.geometry("1100x820")
        self.root.minsize(960, 700)

        # Colori tema chiaro / moderno (rif photo)
        self.BG = "#F9FAFB"          # Sfondo applicazione grigio chiarissimo
        self.BG_SECONDARY = "#FFFFFF" # Sfondo pannelli/aree bianco puro
        self.FG = "#1F2937"          # Testo scuro
        self.ACCENT = "#9D4EDD"      # Viola acceso (primario)
        self.ACCENT_HOVER = "#7B2CBF" # Viola più scuro per hover
        self.SUCCESS = "#10B981"     # Verde smeraldo per export
        self.SUCCESS_HOVER = "#059669"
        self.ERROR = "#EF4444"       # Rosso per errori
        self.SURFACE = "#F3F4F6"     # Sfondo input / header tabella
        self.OVERLAY = "#9CA3AF"     # Testo secondario / disabilitato

        self.root.configure(bg=self.BG)

        # Variabili di stato
        self.folder_path = tk.StringVar(value="")
        self.results: list[dict] = []  # Risultati dell'analisi
        self.local_images: list[str] = []  # Percorsi immagini locali
        self.url_images_data: dict[str, bytes] = {}  # URL -> bytes scaricati
        self._running = False  # Flag elaborazione in corso
        self._cancel_requested = False  # Flag per l'interruzione manuale

        # Stile ttk
        self._configure_styles()

        # Costruzione GUI
        self._build_gui()

    # ────────────── Stile ttk ──────────────
    def _configure_styles(self):
        """Configura gli stili ttk per il tema chiaro."""
        style = ttk.Style()
        style.theme_use("clam")

        style.configure("TFrame", background=self.BG)
        style.configure("Secondary.TFrame", background=self.BG_SECONDARY)

        style.configure("TLabel", background=self.BG, foreground=self.FG,
                         font=("Segoe UI", 10))
        style.configure("Header.TLabel", background=self.BG, foreground=self.ACCENT,
                         font=("Georgia", 16)) # Font più elegante per i titoli
        style.configure("Small.TLabel", background=self.BG, foreground=self.OVERLAY,
                         font=("Segoe UI", 9))

        style.configure("Accent.TButton", background=self.ACCENT, foreground="#FFFFFF",
                         font=("Segoe UI", 10, "bold"), padding=(14, 8), borderwidth=0)
        style.map("Accent.TButton",
                  background=[("active", self.ACCENT_HOVER)],
                  foreground=[("active", "#FFFFFF")])

        style.configure("Secondary.TButton", background=self.SURFACE, foreground=self.FG,
                         font=("Segoe UI", 10), padding=(12, 6), borderwidth=0)
        style.map("Secondary.TButton",
                  background=[("active", "#E5E7EB")],
                  foreground=[("active", self.FG)])

        style.configure("Success.TButton", background=self.SUCCESS, foreground="#FFFFFF",
                         font=("Segoe UI", 10, "bold"), padding=(14, 8), borderwidth=0)
        style.map("Success.TButton",
                  background=[("active", self.SUCCESS_HOVER)],
                  foreground=[("active", "#FFFFFF")])

        # Treeview
        style.configure("Treeview",
                         background=self.BG_SECONDARY,
                         foreground=self.FG,
                         rowheight=35,
                         fieldbackground=self.BG_SECONDARY,
                         borderwidth=0,
                         font=("Segoe UI", 10))
        style.configure("Treeview.Heading",
                         background=self.SURFACE,
                         foreground=self.FG,
                         font=("Segoe UI", 10, "bold"),
                         borderwidth=0, padding=5)
        style.map("Treeview",
                  background=[("selected", self.SURFACE)],
                  foreground=[("selected", self.ACCENT)])

    # ────────────── Costruzione GUI ──────────────
    class CanvasRoundedButton(tk.Canvas):
        """Simula un bottone arrotondato usando Canvas (Tkinter nativo senza immagini)."""
        def __init__(self, master, text, command, bg, fg, hover_bg, radius=15, font=("Segoe UI", 10, "bold"), **kwargs):
            super().__init__(master, bg=master["bg"] if "bg" in master.keys() else "#F9FAFB",
                             highlightthickness=0, **kwargs)
            self.command = command
            self.bg = bg
            self.fg = fg
            self.hover_bg = hover_bg
            self.radius = radius
            self.text = text
            self.font = font
            self.state = "normal"

            self.bind("<Configure>", self._draw)
            self.bind("<ButtonPress-1>", self._on_press)
            self.bind("<ButtonRelease-1>", self._on_release)
            self.bind("<Enter>", self._on_enter)
            self.bind("<Leave>", self._on_leave)

        def _draw(self, event=None):
            self.delete("all")
            w = self.winfo_width()
            h = self.winfo_height()
            if w <= 1 or h <= 1: return
            
            fill_color = self.bg if self.state == "normal" else "#9CA3AF"  # Grigio se disabled
            
            # Disegna rettangolo arrotondato
            r = self.radius
            self.create_polygon(
                r, 0, w-r, 0, w, 0, w, r, w, h-r, w, h, w-r, h,
                r, h, 0, h, 0, h-r, 0, r, 0, 0,
                fill=fill_color, smooth=True, tags="bg_rect"
            )
            # Testo
            text_color = self.fg if self.state == "normal" else "#E5E7EB"
            self.create_text(w/2, h/2, text=self.text, fill=text_color,
                             font=self.font, tags="text")

        def _on_enter(self, e):
            if self.state == "normal":
                self.itemconfig("bg_rect", fill=self.hover_bg)

        def _on_leave(self, e):
            if self.state == "normal":
                self.itemconfig("bg_rect", fill=self.bg)

        def _on_press(self, e):
            if self.state == "normal":
                # Effetto click: diventa più scuro
                self.itemconfig("bg_rect", fill=self.bg) # Ritorna al bg base o un terzo colore

        def _on_release(self, e):
            if self.state == "normal":
                self.itemconfig("bg_rect", fill=self.hover_bg)
                if self.command:
                    self.command()

        def configure(self, **kwargs):
            if "state" in kwargs:
                self.state = kwargs["state"]
                self._draw()
            super().configure(**{k:v for k,v in kwargs.items() if k != "state"})

    def _build_gui(self):
        """Costruisce l'intera interfaccia grafica."""

        # Container principale con scroll
        main_frame = ttk.Frame(self.root, style="TFrame")
        main_frame.pack(fill=tk.BOTH, expand=True, padx=16, pady=12)

        # ── TITOLO ──
        title_lbl = ttk.Label(main_frame, text="🖼️  SEO Image Renamer",
                              style="Header.TLabel",
                              font=("Segoe UI", 18, "bold"))
        title_lbl.pack(anchor="w", pady=(0, 4))

        subtitle_lbl = ttk.Label(main_frame,
                                 text="Rinomina le tue immagini in ottica SEO con Gemini AI",
                                 style="Small.TLabel",
                                 font=("Segoe UI", 10))
        subtitle_lbl.pack(anchor="w", pady=(0, 12))

        # ── SEZIONE CONFIGURAZIONE ──
        config_frame = ttk.Frame(main_frame, style="TFrame")
        config_frame.pack(fill=tk.X, pady=(0, 8))

        # Riga 1: API Key
        row1 = ttk.Frame(config_frame, style="TFrame")
        row1.pack(fill=tk.X, pady=3)
        ttk.Label(row1, text="🔑 API Key Gemini:", width=20, anchor="w").pack(side=tk.LEFT)
        self.api_key_entry = tk.Entry(row1, show="•", bg=self.SURFACE, fg=self.FG,
                                       insertbackground=self.FG,
                                       font=("Segoe UI", 10), relief="flat", bd=0)
        self.api_key_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=5, padx=(4, 0))

        # Riga 2: Link sito
        row2 = ttk.Frame(config_frame, style="TFrame")
        row2.pack(fill=tk.X, pady=3)
        ttk.Label(row2, text="🌐 Link sito (opzionale):", width=20, anchor="w").pack(side=tk.LEFT)
        self.site_url_entry = tk.Entry(row2, bg=self.SURFACE, fg=self.FG,
                                        insertbackground=self.FG,
                                        font=("Segoe UI", 10), relief="flat", bd=0)
        self.site_url_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=5, padx=(4, 0))

        # ── KEYWORDS ──
        kw_frame = ttk.Frame(main_frame, style="TFrame")
        kw_frame.pack(fill=tk.X, pady=(0, 8))
        ttk.Label(kw_frame, text="📝 Keyword del cliente (una per riga o separate da virgola):").pack(anchor="w")
        self.keywords_text = tk.Text(kw_frame, height=3, bg=self.SURFACE, fg=self.FG,
                                      insertbackground=self.FG, font=("Segoe UI", 10),
                                      relief="flat", bd=0, wrap="word")
        self.keywords_text.pack(fill=tk.X, pady=(4, 0), ipady=3)

        # ── INPUT IMMAGINI: due colonne ──
        input_frame = ttk.Frame(main_frame, style="TFrame")
        input_frame.pack(fill=tk.X, pady=(0, 8))
        input_frame.columnconfigure(0, weight=1)
        input_frame.columnconfigure(1, weight=1)

        # Colonna sinistra: cartella locale
        left = ttk.Frame(input_frame, style="TFrame")
        left.grid(row=0, column=0, sticky="nsew", padx=(0, 6))
        ttk.Label(left, text="📁 Cartella locale:").pack(anchor="w")
        folder_row = ttk.Frame(left, style="TFrame")
        folder_row.pack(fill=tk.X, pady=(4, 0))
        self.folder_label = tk.Label(folder_row, textvariable=self.folder_path,
                                      bg=self.SURFACE, fg=self.FG, anchor="w",
                                      font=("Segoe UI", 9), relief="flat", padx=6, pady=5)
        self.folder_label.pack(side=tk.LEFT, fill=tk.X, expand=True)

        self.CanvasRoundedButton(folder_row, text="Sfoglia…", 
                                 bg=self.SUCCESS, fg="#FFFFFF", hover_bg=self.SUCCESS_HOVER, 
                                 radius=12, font=("Segoe UI", 10, "bold"), command=self._select_folder, 
                                 width=80, height=30).pack(side=tk.RIGHT, padx=(4, 0))

        # Colonna destra: URL immagini
        right = ttk.Frame(input_frame, style="TFrame")
        right.grid(row=0, column=1, sticky="nsew", padx=(6, 0))
        ttk.Label(right, text="🔗 URL immagini (uno per riga):").pack(anchor="w")
        self.urls_text = tk.Text(right, height=4, bg=self.SURFACE, fg=self.FG,
                                  insertbackground=self.FG, font=("Segoe UI", 10),
                                  relief="flat", bd=0, wrap="word")
        self.urls_text.pack(fill=tk.BOTH, expand=True, pady=(4, 0), ipady=3)

        # ── PULSANTE AVVIA ──
        btn_frame = ttk.Frame(main_frame, style="TFrame")
        btn_frame.pack(fill=tk.X, pady=(4, 8))
        self.start_btn = self.CanvasRoundedButton(btn_frame, text="🚀  Avvia Analisi",
                                                  bg=self.ACCENT, fg="#FFFFFF", hover_bg=self.ACCENT_HOVER,
                                                  radius=15, font=("Segoe UI", 10, "bold"),
                                                  command=self._start_analysis, width=140, height=38)
        self.start_btn.pack(side=tk.LEFT)

        self.stop_btn = self.CanvasRoundedButton(btn_frame, text="🛑  Ferma",
                                                 bg=self.ERROR, fg="#FFFFFF", hover_bg="#DC2626",
                                                 radius=15, font=("Segoe UI", 10, "bold"),
                                                 command=self._stop_analysis, state="disabled", width=100, height=38)
        self.stop_btn.pack(side=tk.LEFT, padx=(8, 0))

        # Progress bar
        self.progress_var = tk.DoubleVar(value=0)
        self.progress_bar = ttk.Progressbar(btn_frame, orient="horizontal",
                                             mode="determinate",
                                             variable=self.progress_var,
                                             style="Horizontal.TProgressbar")
        self.progress_bar.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(12, 0))

        # ── TABELLA RISULTATI ──
        tree_frame = ttk.Frame(main_frame, style="TFrame")
        tree_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 8))

        columns = ("original", "seo_name", "alt_text")
        self.tree = ttk.Treeview(tree_frame, columns=columns, show="headings", height=8)
        self.tree.heading("original", text="Nome Originale")
        self.tree.heading("seo_name", text="Nome SEO Suggerito")
        self.tree.heading("alt_text", text="Alt Text")
        self.tree.column("original", width=220, minwidth=140)
        self.tree.column("seo_name", width=280, minwidth=180)
        self.tree.column("alt_text", width=380, minwidth=200)

        scrollbar = ttk.Scrollbar(tree_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # ── PULSANTI ESPORTAZIONE ──
        export_frame = ttk.Frame(main_frame, style="TFrame")
        export_frame.pack(fill=tk.X, pady=(0, 8))
        self.csv_btn = self.CanvasRoundedButton(export_frame, text="📄 Scarica CSV",
                                                bg=self.SUCCESS, fg="#FFFFFF", hover_bg=self.SUCCESS_HOVER,
                                                radius=15, font=("Segoe UI", 10, "bold"),
                                                command=self._export_csv, state="disabled", width=130, height=38)
        self.csv_btn.pack(side=tk.LEFT, padx=(0, 8))

        self.zip_btn = self.CanvasRoundedButton(export_frame, text="📦 Scarica ZIP",
                                                bg=self.SUCCESS, fg="#FFFFFF", hover_bg=self.SUCCESS_HOVER,
                                                radius=15, font=("Segoe UI", 10, "bold"),
                                                command=self._export_zip, state="disabled", width=130, height=38)
        self.zip_btn.pack(side=tk.LEFT)

        # ── AREA LOG ──
        log_frame = ttk.Frame(main_frame, style="TFrame")
        log_frame.pack(fill=tk.X)
        ttk.Label(log_frame, text="📋 Log:").pack(anchor="w")
        self.log_text = tk.Text(log_frame, height=12, bg=self.BG_SECONDARY, fg=self.FG,  # Aumentata height a 12
                                 font=("Consolas", 10), relief="flat", bd=0,             # Font più grande
                                 state="disabled", wrap="word")
        self.log_text.pack(fill=tk.X, pady=(4, 0))

        # Tag colori per il log
        self.log_text.tag_configure("info", foreground=self.ACCENT)
        self.log_text.tag_configure("success", foreground=self.SUCCESS)
        self.log_text.tag_configure("error", foreground=self.ERROR)

    # ────────────── Metodi di utilità GUI ──────────────

    def _log(self, message: str, tag: str = "info"):
        """Aggiunge un messaggio nell'area log."""
        self.log_text.configure(state="normal")
        self.log_text.insert(tk.END, message + "\n", tag)
        self.log_text.see(tk.END)
        self.log_text.configure(state="disabled")

    def _select_folder(self):
        """Apre il dialogo per selezionare una cartella con immagini."""
        folder = filedialog.askdirectory(title="Seleziona cartella immagini")
        if folder:
            self.folder_path.set(folder)
            self._log(f"📁 Cartella selezionata: {folder}", "info")

    def _get_keywords(self) -> str:
        """Restituisce le keyword inserite dall'utente, formattate."""
        raw = self.keywords_text.get("1.0", tk.END).strip()
        # Accetta sia virgola che a-capo come separatore
        keywords = [k.strip() for k in re.split(r"[,\n]+", raw) if k.strip()]
        return ", ".join(keywords)

    def _get_urls(self) -> list[str]:
        """Restituisce la lista di URL inseriti dall'utente."""
        raw = self.urls_text.get("1.0", tk.END).strip()
        return [u.strip() for u in raw.splitlines() if u.strip()]

    # ────────────── Raccolta immagini ──────────────

    def _collect_local_images(self) -> list[str]:
        """Raccoglie i percorsi delle immagini nella cartella selezionata."""
        folder = self.folder_path.get()
        if not folder or not os.path.isdir(folder):
            return []
        images = []
        for f in sorted(os.listdir(folder)):
            ext = os.path.splitext(f)[1].lower()
            if ext in SUPPORTED_EXTENSIONS:
                images.append(os.path.join(folder, f))
        return images

    def _download_url_image(self, url: str) -> bytes | None:
        """Scarica un'immagine da un URL e restituisce i bytes."""
        try:
            resp = requests.get(url, timeout=15, stream=True)
            resp.raise_for_status()
            return resp.content
        except Exception as e:
            self.root.after(0, self._log,
                           f"❌ Impossibile scaricare {url}: {e}", "error")
            return None

    # ────────────── Chiamata Gemini API ──────────────

    def _call_gemini(self, model, image_bytes: bytes, original_name: str,
                     keywords: str, site_url: str, ext: str) -> dict | None:
        """Invia un'immagine a Gemini e restituisce il JSON di risposta.
        Include retry automatico (max 3 tentativi, attesa 30s) per errori 429."""
        max_retries = 3
        retry_wait = 30  # secondi di attesa tra i retry

        # Costruisci il system prompt con le keyword e il sito
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            keywords=keywords if keywords else "(nessuna keyword fornita)",
            site_url=site_url if site_url else "(non fornito)"
        )

        for attempt in range(1, max_retries + 1):
            try:
                # Carica e ridimensiona l'immagine per risparmiare token e velocizzare l'analisi
                pil_image = Image.open(io.BytesIO(image_bytes))
                
                # Converti in RGB se necessario (es. PNG trasparenti o RGBA)
                if pil_image.mode in ('RGBA', 'P'):
                    pil_image = pil_image.convert('RGB')

                # Ridimensiona a max 800x800 per evitare di sprecare token
                pil_image.thumbnail((800, 800))
                
                # Salva l'immagine compressa in un buffer memory
                buffer = io.BytesIO()
                # Forziamo jpeg per l'invio web in modo da minimizzare peso e token
                pil_image.save(buffer, format="JPEG", quality=85)
                compressed_bytes = buffer.getvalue()
                mime_type = "image/jpeg"

                # Invia a Gemini con l'immagine ridotta
                response = model.generate_content(
                    [
                        system_prompt,
                        {"mime_type": mime_type, "data": compressed_bytes}
                    ]
                )

                # Estrai il testo di risposta
                text = response.text.strip()

                # Rimuovi eventuale blocco di codice markdown
                if text.startswith("```"):
                    text = re.sub(r"^```(?:json)?\s*", "", text)
                    text = re.sub(r"\s*```$", "", text)

                result = json.loads(text)
                return result

            except json.JSONDecodeError as e:
                self.root.after(0, self._log,
                               f"⚠️ Risposta non JSON per '{original_name}': {e}", "error")
                return None
            except Exception as e:
                error_str = str(e)
                # Controlla se è un errore 429 (rate limit / quota exceeded)
                if "429" in error_str or "quota" in error_str.lower() or "rate" in error_str.lower():
                    if attempt < max_retries:
                        self.root.after(0, self._log,
                                       f"⏳ Rate limit (429) per '{original_name}'. "
                                       f"Tentativo {attempt}/{max_retries}. "
                                       f"Attesa {retry_wait}s prima di riprovare…", "error")
                        time.sleep(retry_wait)
                        # Aumenta l'attesa per il successivo retry
                        retry_wait += 30
                        continue
                    else:
                        self.root.after(0, self._log,
                                       f"❌ Rate limit (429) per '{original_name}': "
                                       f"esauriti {max_retries} tentativi.", "error")
                        return None
                else:
                    self.root.after(0, self._log,
                                   f"❌ Errore API per '{original_name}': {e}", "error")
                    return None
        return None

    # ────────────── Logica di analisi ──────────────

    def _stop_analysis(self):
        """Richiede l'interruzione dell'analisi in corso."""
        if self._running:
            self._cancel_requested = True
            self.stop_btn.configure(state="disabled")
            self._log("🛑 Interruzione richiesta. Attendi la fine dell'immagine corrente...", "error")

    def _start_analysis(self):
        """Avvia l'analisi in un thread separato."""
        if self._running:
            return

        # Validazione API key
        api_key = self.api_key_entry.get().strip()
        if not api_key:
            messagebox.showwarning("API Key mancante",
                                   "Inserisci la tua API Key Gemini prima di avviare l'analisi.")
            return

        # Raccolta immagini
        self.local_images = self._collect_local_images()
        urls = self._get_urls()

        if not self.local_images and not urls:
            messagebox.showwarning("Nessuna immagine",
                                   "Seleziona una cartella o inserisci almeno un URL di un'immagine.")
            return

        # Resetta lo stato
        self._running = True
        self._cancel_requested = False
        self.results.clear()
        self.url_images_data.clear()
        self.tree.delete(*self.tree.get_children())
        self.csv_btn.configure(state="disabled")
        self.zip_btn.configure(state="disabled")
        self.start_btn.configure(state="disabled")
        self.stop_btn.configure(state="normal")
        self.progress_var.set(0)
        self.log_text.configure(state="normal")
        self.log_text.delete("1.0", tk.END)
        self.log_text.configure(state="disabled")

        # Avvia thread
        thread = threading.Thread(target=self._analysis_worker,
                                   args=(api_key, urls), daemon=True)
        thread.start()

    def _analysis_worker(self, api_key: str, urls: list[str]):
        """Worker thread: elabora tutte le immagini."""
        try:
            # Configura Gemini
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-3.1-flash-lite-preview")

            keywords = self._get_keywords()
            site_url = self.site_url_entry.get().strip()

            # Prepara la lista di job: (nome_originale, image_bytes, estensione, sorgente)
            jobs: list[tuple[str, bytes, str, str]] = []

            # Immagini locali
            for path in self.local_images:
                name = os.path.basename(path)
                ext = os.path.splitext(name)[1]
                with open(path, "rb") as f:
                    data = f.read()
                jobs.append((name, data, ext, "local"))
                self.root.after(0, self._log,
                               f"📂 Caricata immagine locale: {name}", "info")

            # Immagini da URL
            for url in urls:
                self.root.after(0, self._log,
                               f"⬇️ Scaricamento: {url}", "info")
                data = self._download_url_image(url)
                if data is None:
                    continue
                # Estrai nome e estensione dall'URL
                url_path = url.split("?")[0].split("#")[0]
                name = os.path.basename(url_path) or "image.jpg"
                ext = os.path.splitext(name)[1]
                if ext.lower() not in SUPPORTED_EXTENSIONS:
                    ext = ".jpg"
                    name = name + ext if "." not in name else name
                self.url_images_data[url] = data
                jobs.append((name, data, ext, url))
                self.root.after(0, self._log,
                               f"✅ Scaricata: {name}", "success")

            total = len(jobs)
            if total == 0:
                self.root.after(0, self._log,
                               "⚠️ Nessuna immagine valida trovata.", "error")
                self.root.after(0, self._finish_analysis)
                return

            self.root.after(0, self._log,
                           f"\n🔍 Avvio analisi di {total} immagini…\n", "info")

            # Processa ogni immagine
            used_names = {}  # Per evitare nomi duplicati

            for i, (name, data, ext, source) in enumerate(jobs, 1):
                if self._cancel_requested:
                    self.root.after(0, self._log, "\n🛑 Analisi interrotta dall'utente.", "error")
                    break

                self.root.after(0, self._log,
                               f"[{i}/{total}] Analisi: {name}…", "info")

                result = self._call_gemini(model, data, name, keywords, site_url, ext)

                if result:
                    # 1) Assicurati che l'estensione sia quella originale
                    seo_name_raw = result.get("filename", name)
                    base_seo = os.path.splitext(seo_name_raw)[0]
                    # Rimuovi eventuali suffissi numerici che Gemini potrebbe aver aggiunto per sbaglio (es: -1, -2)
                    base_seo = re.sub(r'-\d+$', '', base_seo)

                    # 2) Gestione duplicati (aggiunge -1, -2, ecc.)
                    if base_seo in used_names:
                        used_names[base_seo] += 1
                        final_seo_name = f"{base_seo}-{used_names[base_seo]}{ext}"
                    else:
                        used_names[base_seo] = 0
                        final_seo_name = f"{base_seo}{ext}"

                    entry = {
                        "nome_originale": name,
                        "nome_seo": final_seo_name,
                        "alt_text": result.get("alt_text", ""),
                        "motivazione": result.get("motivazione", ""),
                        "varianti": result.get("varianti", []),
                        "source": source,  # percorso locale o URL
                        "data": data,
                        "ext": ext
                    }
                    self.results.append(entry)

                    # Aggiorna la tabella nella GUI
                    self.root.after(0, self._add_tree_row, entry)
                    self.root.after(0, self._log,
                                   f"   ✅ → {entry['nome_seo']}", "success")
                else:
                    self.root.after(0, self._log,
                                   f"   ⚠️ Analisi fallita per {name}", "error")

                # Delay preventivo per rate limit (15 req/min = 1 ogni 4 sec)
                if i < total:
                    time.sleep(4.5)

                # Aggiorna progress bar
                progress = (i / total) * 100
                self.root.after(0, self.progress_var.set, progress)

            self.root.after(0, self._log,
                           f"\n🎉 Analisi completata! {len(self.results)}/{total} immagini elaborate.",
                           "success")

        except Exception as e:
            self.root.after(0, self._log, f"❌ Errore critico: {e}", "error")

        finally:
            self.root.after(0, self._finish_analysis)

    def _add_tree_row(self, entry: dict):
        """Aggiunge una riga alla tabella dei risultati."""
        self.tree.insert("", tk.END, values=(
            entry["nome_originale"],
            entry["nome_seo"],
            entry["alt_text"]
        ))

    def _finish_analysis(self):
        """Ripristina lo stato della GUI al termine dell'analisi."""
        self._running = False
        self._cancel_requested = False
        self.start_btn.configure(state="normal")
        self.stop_btn.configure(state="disabled")
        if self.results:
            self.csv_btn.configure(state="normal")
            self.zip_btn.configure(state="normal")

    # ────────────── Esportazione CSV ──────────────

    def _export_csv(self):
        """Esporta i risultati in un file CSV con encoding UTF-8 BOM."""
        if not self.results:
            return

        filepath = filedialog.asksaveasfilename(
            defaultextension=".csv",
            initialfile="risultati-seo.csv",
            filetypes=[("File CSV", "*.csv")],
            title="Salva risultati CSV"
        )
        if not filepath:
            return

        try:
            with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
                writer = csv.writer(f)
                writer.writerow([
                    "nome_originale", "nome_seo", "alt_text",
                    "motivazione", "variante_1", "variante_2", "variante_3"
                ])
                for r in self.results:
                    varianti = r.get("varianti", [])
                    writer.writerow([
                        r["nome_originale"],
                        r["nome_seo"],
                        r["alt_text"],
                        r["motivazione"],
                        varianti[0] if len(varianti) > 0 else "",
                        varianti[1] if len(varianti) > 1 else "",
                        varianti[2] if len(varianti) > 2 else "",
                    ])

            self._log(f"📄 CSV salvato: {filepath}", "success")
            messagebox.showinfo("CSV Esportato", f"File CSV salvato in:\n{filepath}")

        except Exception as e:
            self._log(f"❌ Errore salvataggio CSV: {e}", "error")
            messagebox.showerror("Errore", f"Impossibile salvare il CSV:\n{e}")

    # ────────────── Esportazione ZIP ──────────────

    def _export_zip(self):
        """Crea un file ZIP con le immagini rinominate."""
        if not self.results:
            return

        filepath = filedialog.asksaveasfilename(
            defaultextension=".zip",
            initialfile="immagini-seo-rinominate.zip",
            filetypes=[("File ZIP", "*.zip")],
            title="Salva immagini rinominate (ZIP)"
        )
        if not filepath:
            return

        try:
            with zipfile.ZipFile(filepath, "w", zipfile.ZIP_DEFLATED) as zf:
                for r in self.results:
                    seo_name = r["nome_seo"]
                    image_data = r.get("data")

                    if image_data:
                        zf.writestr(seo_name, image_data)
                        self._log(f"📦 Aggiunto al ZIP: {seo_name}", "info")
                    else:
                        self._log(f"⚠️ Dati mancanti per: {r['nome_originale']}", "error")

            self._log(f"📦 ZIP salvato: {filepath}", "success")
            messagebox.showinfo("ZIP Creato", f"File ZIP salvato in:\n{filepath}")

        except Exception as e:
            self._log(f"❌ Errore creazione ZIP: {e}", "error")
            messagebox.showerror("Errore", f"Impossibile creare il ZIP:\n{e}")


# ────────────────────────────────────────────────────────────
# Entry point
# ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    root = tk.Tk()
    app = SEOImageRenamerApp(root)
    root.mainloop()
