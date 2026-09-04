# Interaktiv Decision Landscape – Abonnement og utstyr

## Formål

Dette verktøyet er et interaktivt beslutningslandskap som visualiserer prosessen for tildeling av mobilt utstyr og abonnement til ansatte i en bedrift. Det er laget for å hjelpe med å forstå og kommunisere hvordan ulike valg og policyer påvirker hverandre – hvem betaler hva, hvilke regler gjelder, og hvordan flyter informasjonen mellom bruker, avdeling og fakturering.

## Filen

Alt ligger i én enkelt HTML-fil uten eksterne avhengigheter:

```
/Users/vegard.szilvay/InteraktivDecisionTree/abonnement-utstyr.html
```

## Tre visninger

### 1. Wizard (tab: Flyt)
En trinn-for-trinn veiviser (state machine) der man går gjennom alle valg i rekkefølge:
- Bruker og avdeling
- Policy (arvet fra avdeling eller individuell)
- Utstyr (kjøp eller leasing, pris, varighet)
- Abonnement (plan, SIM-type)
- Fakturering (fakturasted for utstyr og/eller abonnement)
- Mellomlegg / betaling dersom pris overstiger policy

### 2. Nodegraf (tab: Graf)
En SVG-basert nodegraf som bygger seg opp live mens man går gjennom wizarden. Viser relasjoner mellom: Bruker → Avdeling → Policy → Enhet/Abonnement → Fakturasted → Mellomlegg → Betaling.

### 3. Testbruker (tab: Testbruker)
Et interaktivt sandkassemiljø med:
- **Konfigurasjonspanel** (høyre side): toggles og inputs for å justere alle parametere live
- **Nodegraf** (venstre side): oppdateres umiddelbart basert på konfigurasjonen
- **Kostnadskort** (nederst til venstre i grafen): viser Bedrift vs. Ansatt kostnad for utstyr og abonnement

## Sentrale konsepter

### testState
Objektet som driver Testbruker-visningen:
```javascript
{
  bruker:      { navn },
  avdeling:    { navn, kostnadssenter },
  policy:      { enhetAktiv, enhetMaxPris, aboAktiv, aboMaxPris, enhetUtvalg, enhetUtvalgListe },
  enhet:       { aktiv, pris, kjøpsmodell, leasingMåneder },
  abonnement:  { aktiv, plan, pris, simType },
  fakturasted: { enhet, abo, splitAbo },
  betaling:    { frekvens }
}
```

### Policy
- **Maks pris utstyr**: bedrift dekker opp til X kr, ansatt betaler resten (mellomlegg)
- **Maks pris abonnement**: tilsvarende for månedlig abo-kostnad
- **Enhetsbegrensning**: når på, ser bruker kun et forhåndsgodkjent utvalg av enheter (visualisert som en Katalog-node i grafen)
- Skrus en policy av → bedrift dekker alt, ingen mellomlegg

### Mellomlegg
- **Kjøp**: engangsbeløp = pris − policy-maks
- **Leasing**: månedlig = (pris − policy-maks) / antall måneder

### Fakturasted
- Kan splittes: utstyr og abonnement faktureres til forskjellige steder
- Når splittet vises to separate Fakturasted-noder i grafen
- Fakturasted-nodene viser faktureringssummen (bedriftens andel)

## Teknisk

- Rent HTML/CSS/JS, ingen rammeverk eller byggsteg
- SVG-graf med SMIL-animasjoner (stroke-dashoffset)
- Kant-chips tegnes på midtpunktet av synlig kant-segment (grensepunkt-til-grensepunkt, ikke senter-til-senter)
- `computeTestNodeState()` beregner hvilke noder og kanter som er aktive
- `renderTestGraph()` rendrer SVG + oppdaterer DOM-elementer i panelet
