# SEO Image Renamer — Web App TODO

## Priorità Alta

- [ ] Editing in-line nella tabella (modifica nome SEO e alt text prima di esportare)
- [ ] Validazione input (feedback visivo su keyword mancanti, URL non validi, limite immagini)
- [ ] Persistenza sessione (localStorage per non perdere risultati al refresh)

## Priorità Media

- [ ] Copia intera riga (nome SEO + alt text come HTML `<img>`)
- [ ] Bulk copy (copiare tutti gli alt text o nomi SEO in un colpo)
- [ ] Filtro/ricerca nella tabella risultati
- [ ] Cronologia analisi (sessioni passate rivisitabili)
- [ ] Progress stimato (tempo rimanente basato su delay * immagini restanti)

## Priorità Bassa

- [ ] Crawl pagina web (inserisci URL pagina, estrai automaticamente tutte le immagini)
- [ ] Confronto before/after (diff visuale nome originale vs nome SEO)
- [ ] Multi-lingua prompt (switch italiano/inglese/spagnolo per il system prompt)
- [ ] Rate limit configurabile (slider delay tra richieste, per piani Gemini a pagamento)
- [ ] Webhook/notifica browser a fine analisi batch lungo
