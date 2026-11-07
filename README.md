# Room Header Card

Home Assistant dashboard card: a room header with room name, icon, temperature, optional air conditioner and up to four window/door icons that appear **only while open**. An optional inner card (for example an `entities` card) sits in the same box.

Dashboard-Karte für Home Assistant: Raumkopf mit Raumname, Symbol, Temperatur, optional Klimaanlage und bis zu vier Fenster-/Tür-Symbolen, die **nur bei „offen"** erscheinen. Darunter kann im selben Kasten eine beliebige Karte stehen, zum Beispiel eine Entities-Karte.

> **License:** PolyForm Noncommercial 1.0.0. Free for private and other noncommercial use, **not for commercial use**. See [LICENSE](LICENSE). This is source-available, not open source.
> **Lizenz:** PolyForm Noncommercial 1.0.0. Frei für private und andere nicht kommerzielle Nutzung, **nicht für kommerzielle Nutzung**.

## Installation

1. HACS → Dashboard (Frontend) → Benutzerdefinierte Repositories → dieses Repository mit Typ *Dashboard* hinzufügen.
2. Karte installieren, Seite neu laden.
3. HACS trägt die Ressource `/hacsfiles/room-header-card/room-header-card.js` ein.

## Konfiguration

```yaml
type: custom:room-header-card
name: Wohnzimmer
icon: mdi:sofa
climate: climate.wohnzimmer_heizung        # Heizung: Temperatur, Tippen öffnet den Dialog
ac: climate.wohnzimmer_klima               # optional, auch Liste möglich
temperature: sensor.wohnzimmer_temperatur  # optional, wenn es kein climate gibt
windows:                                   # bis zu 4
  - entity: binary_sensor.fenster_gross
    kind: window                           # window | door | roof
    name: Großes Fenster
  - entity: binary_sensor.terrassentuer
    kind: door
  - entity: binary_sensor.haustuer_offen   # Tür offen/zu
    lock: lock.haustuer                    # zusätzlich: verriegelt?
    kind: door
card:                                      # optional: Karte im selben Kasten
  type: entities
  entities:
    - light.wohnzimmer_decke
    - cover.wohnzimmer_rollo
```

| Option | Bedeutung |
|---|---|
| `name` | Raumname (Pflicht) |
| `icon` | Symbol des Raums, Standard `mdi:home` |
| `climate` | Heizung; zeigt `current_temperature`, orange bei `hvac_action: heating` |
| `temperature` | Temperatursensor, falls kein `climate` vorhanden |
| `ac` | Klimaanlage (eigenes Symbol, Farbe nach Modus); Entität oder Liste |
| `windows` | Liste mit `entity`, `entity` (offen/zu), `kind` (`window`, `door`, `roof`), `name`, `icon`, `lock`, `lock_icon`; es werden höchstens vier angezeigt |
| `card` | Beliebige Karte, die unter der Kopfzeile im gleichen Kasten angezeigt wird |

Fenster-Symbole sind rot und erscheinen nur, wenn der Sensor `on` oder `open` meldet. Mit `lock` (Schloss-Entität `lock.*` oder `binary_sensor`) bekommt eine Tür einen zweiten Status: Ist sie **zu, aber nicht verriegelt**, erscheint ein orangefarbenes offenes Schloss (`mdi:lock-open-variant`); ist sie offen, das rote Türsymbol. `entity` darf dann auch fehlen (nur Schloss-Status). Als nicht verriegelt gelten `unlocked`, `unlocking`, `open`, `jammed` und `on`.

Tippen auf ein Symbol öffnet den Dialog der Entität.

## Hinweise

- Die Karte enthält keinen fremden Code und lädt nichts von außen. Symbole kommen aus den Material Design Icons von Home Assistant.
- Entwickelt und im Einsatz mit Home Assistant 2026.10. Auf anderen Versionen nicht getestet.
