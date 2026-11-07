/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Required Notice: Copyright 2026 anc0bude (https://github.com/anc0bude)
 */
/* room-header-card – Raumkopf mit Temperatur und bis zu 4 Fenster-/Tür-Symbolen (nur bei "offen").
 *
 * type: custom:room-header-card
 * name: Wohnzimmer
 * icon: mdi:sofa
 * climate: climate.wohnzimmer_heizung        # Heizung: Temperatur-Anzeige, Tippen öffnet Dialog
 * temperature: sensor.garage_temperatur        # optional statt climate: reiner Temperatursensor (z. B. Präsenzmelder)
 * ac: climate.wohnzimmer_klima                  # optional: Klimaanlage (eigenes Symbol, Farbe nach Modus); auch Liste möglich
 * windows:                                     # max. 4
 *   - entity: binary_sensor.fenster_gross
 *     kind: window                             # window | door | roof
 *     name: Großes Fenster                     # optional
 *     lock: lock.haustuer                      # optional: Schloss-Entität; Tür zu, aber nicht verriegelt -> orange Symbol Schloss offen
 *     lock_icon: mdi:lock-open-variant         # optional
 * card:                                        # optional: darunter liegende Karte im selben Kasten
 *   type: entities
 *   entities: [...]
 */
const KIND_ICON = { window: "mdi:window-open-variant", door: "mdi:door-open", roof: "mdi:skylight" };
const MAX_WINDOWS = 4;

class RoomHeaderCard extends HTMLElement {
  setConfig(config) {
    if (!config || !config.name) throw new Error("name fehlt");
    this._config = { windows: [], ...config };
    this._config.ac = [].concat(this._config.ac || []);
    if (this._config.windows.length > MAX_WINDOWS) {
      console.warn(`room-header-card: nur die ersten ${MAX_WINDOWS} Fenster werden angezeigt`);
      this._config.windows = this._config.windows.slice(0, MAX_WINDOWS);
    }
    this._built = false;
    this._build();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._inner) this._inner.hass = hass;
    this._update();
  }

  getCardSize() { return 1 + (this._inner?.getCardSize?.() ?? 0); }

  async _build() {
    if (!this._config) return;
    this.innerHTML = `
      <ha-card>
        <style>
          .head{display:flex;align-items:center;gap:10px;padding:12px 16px}
          .head ha-icon.room{color:var(--secondary-text-color);flex:none}
          .name{flex:1;min-width:0;font-weight:500;font-size:1.05em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .badge{display:flex;align-items:center;gap:4px;cursor:pointer;font-variant-numeric:tabular-nums;flex:none}
          .badge ha-icon{--mdc-icon-size:20px}
          .win{color:var(--error-color,#db4437)}
          .win.unlocked{color:var(--warning-color,#ffa600)}
          .temp{color:var(--primary-text-color)}
          .temp.heating{color:var(--state-climate-heat-color,#e0702a)}
          .ac{color:var(--secondary-text-color)}
          .ac.cool{color:var(--state-climate-cool-color,#2b9af9)}
          .ac.heat{color:var(--state-climate-heat-color,#e0702a)}
          .ac.dry,.ac.fan_only{color:var(--state-climate-dry-color,#ef6c00)}
          .ac.auto,.ac.heat_cool{color:var(--state-climate-auto-color,#43a047)}
          .inner{border-top:1px solid var(--divider-color)}
        </style>
        <div class="head">
          <ha-icon class="room"></ha-icon>
          <span class="name"></span>
          <span class="wins" style="display:flex;gap:10px"></span>
          <span class="acs" style="display:flex;gap:10px"></span>
          <span class="badge temp" hidden><ha-icon icon="mdi:thermometer"></ha-icon><span class="t"></span></span>
        </div>
        <div class="inner" hidden></div>
      </ha-card>`;
    const root = this.querySelector("ha-card");
    this.querySelector("ha-icon.room").setAttribute("icon", this._config.icon || "mdi:home");
    this.querySelector(".name").textContent = this._config.name;
    this._wins = this.querySelector(".wins");
    this._acs = this.querySelector(".acs");
    this._temp = this.querySelector(".temp");
    this._temp.addEventListener("click", () => this._moreInfo(this._config.climate || this._config.temperature));
    this._innerBox = this.querySelector(".inner");
    if (this._config.card) {
      const helpers = await window.loadCardHelpers();
      this._inner = helpers.createCardElement(this._config.card);
      this._inner.style.setProperty("--ha-card-box-shadow", "none");
      this._inner.style.setProperty("--ha-card-border-width", "0");
      this._inner.style.setProperty("--ha-card-border-radius", "0");
      this._inner.style.setProperty("--ha-card-background", "transparent");
      // Beginnt die Liste mit einer Abschnittsüberschrift, addiert sich deren Abstand zum Innenabstand der Karte: oben etwas zurückziehen
      const first = this._config.card.entities?.[0];
      if (first && first.type === "section") {
        // die Abschnittsüberschrift zeichnet ihre eigene Trennlinie: unsere weglassen und die Liste so weit hochziehen, dass diese Linie direkt unter dem Kopf sitzt
        this._innerBox.style.borderTop = "none";
        this._inner.style.marginTop = "-32px";
      }
      this._innerBox.appendChild(this._inner);
      this._innerBox.hidden = false;
      if (this._hass) this._inner.hass = this._hass;
    }
    this._built = true;
    this._update();
  }

  _moreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId } }));
  }

  _update() {
    if (!this._built || !this._hass) return;
    const hass = this._hass;
    // Temperatur
    const c = this._config.climate && hass.states[this._config.climate];
    const ts = this._config.temperature && hass.states[this._config.temperature];
    const raw = c ? c.attributes.current_temperature : ts?.state;
    const num = raw == null || raw === "" || isNaN(Number(raw)) ? null : Number(raw);
    this._temp.hidden = num == null;
    if (num != null) {
      const unit = hass.config.unit_system.temperature;
      const v = num.toLocaleString(hass.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      this._temp.querySelector(".t").textContent = `${v} ${unit}`;
      this._temp.classList.toggle("heating", !!c && c.attributes.hvac_action === "heating");
    }
    // Klimaanlage(n): Symbol und Farbe nach Modus, Temperatur wenn vorhanden
    const acKey = this._config.ac.map((e) => e + ":" + (hass.states[e]?.state) + ":" + (hass.states[e]?.attributes.current_temperature)).join("|");
    if (acKey !== this._acKey) {
      this._acKey = acKey;
      this._acs.innerHTML = "";
      for (const e of this._config.ac) {
        const st = hass.states[e];
        if (!st) continue;
        const el = document.createElement("span");
        el.className = "badge ac " + st.state;
        el.title = st.attributes.friendly_name || e;
        const ic = document.createElement("ha-icon");
        ic.setAttribute("icon", "mdi:air-conditioner");
        el.appendChild(ic);
        const ct = st.attributes.current_temperature;
        if (ct != null) {
          const t = document.createElement("span");
          t.textContent = Number(ct).toLocaleString(hass.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " " + hass.config.unit_system.temperature;
          el.appendChild(t);
        }
        el.addEventListener("click", () => this._moreInfo(e));
        this._acs.appendChild(el);
      }
    }
    // Fenster/Türen: nur offene bzw. (Türen mit "lock") entriegelte
    const isOn = (id) => { const s = id && hass.states[id]?.state; return s === "on" || s === "open"; };
    const isUnlocked = (id) => { const s = id && hass.states[id]?.state; return s === "unlocked" || s === "unlocking" || s === "open" || s === "jammed" || s === "on"; };
    const items = [];
    for (const w of this._config.windows) {
      if (isOn(w.entity)) items.push({ w, id: w.entity, mode: "open" });
      else if (w.lock && isUnlocked(w.lock)) items.push({ w, id: w.lock, mode: "unlocked" });
    }
    const key = items.map((i) => i.id + ":" + i.mode).join("|");
    if (key !== this._winKey) {
      this._winKey = key;
      this._wins.innerHTML = "";
      for (const { w, id, mode } of items) {
        const el = document.createElement("span");
        el.className = "badge win" + (mode === "unlocked" ? " unlocked" : "");
        const label = w.name || hass.states[w.entity]?.attributes.friendly_name || hass.states[id]?.attributes.friendly_name || id;
        el.title = mode === "unlocked" ? label + " (nicht verriegelt)" : label;
        const ic = document.createElement("ha-icon");
        ic.setAttribute("icon", mode === "unlocked" ? (w.lock_icon || "mdi:lock-open-variant") : (w.icon || KIND_ICON[w.kind] || KIND_ICON.window));
        el.appendChild(ic);
        el.addEventListener("click", () => this._moreInfo(id));
        this._wins.appendChild(el);
      }
    }
  }
}

if (!customElements.get("room-header-card")) customElements.define("room-header-card", RoomHeaderCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "room-header-card", name: "Raumkopf", description: "Raumname, Temperatur und bis zu 4 Fenster-/Türsymbole (nur offen)" });
