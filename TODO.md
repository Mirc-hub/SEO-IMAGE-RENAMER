# SEO Image Renamer — Web App TODO

## Priorità Alta

- [x] Editing in-line nella tabella (modifica nome SEO e alt text prima di esportare)
- [x] Validazione input (feedback visivo su keyword mancanti, URL non validi, limite immagini)
- [x] Persistenza sessione (localStorage per non perdere risultati al refresh)

## Priorità Media

- [x] Copia intera riga (nome SEO + alt text come HTML `<img>`)
- [x] Bulk copy (copiare tutti gli alt text o nomi SEO in un colpo)
- [x] Filtro/ricerca nella tabella risultati
- [x] Cronologia analisi (sessioni passate rivisitabili)
- [x] Progress stimato (tempo rimanente basato su delay * immagini restanti)

## Priorità Bassa

- [ ] Crawl pagina web (inserisci URL pagina, estrai automaticamente tutte le immagini)
- [ ] Confronto before/after (diff visuale nome originale vs nome SEO)
- [ ] Multi-lingua prompt (switch italiano/inglese/spagnolo per il system prompt)
- [ ] Rate limit configurabile (slider delay tra richieste, per piani Gemini a pagamento)
- [ ] Webhook/notifica browser a fine analisi batch lungo
