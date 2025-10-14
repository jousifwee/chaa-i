# P2P & „Serverlos“

## Realität im Web
- Vollständig serverlos ist unpraktisch: Signaling und NAT‑Traversal erfordern einen vermittelnden Dienst.
- P2P mit WebRTC DataChannels ist möglich, aber braucht: Signaling (z. B. über unseren Server), STUN, ggf. TURN.

## Ansatz
- Reuse des bestehenden Servers als Signaling: Austausch von SDP/OFFER/ANSWER/CANDIDATES als normale Nachrichten.
- Nach erfolgreichem Handshake: DataChannel (`reliable: true`) für Chatdaten.
- Kryptographie weiterhin auf Anwendungsebene (zusätzlich zu DTLS/Transport), damit Server nie Klartexte sieht – auch nicht TURN.

## Flow
- A → S (offer) → B, B → S (answer) → A
- ICE Candidates bidirektional via S
- Nach `open`: Nutzung des gleichen JSON‑Protokolls, aber Transport = DataChannel

## TURN/STUN
- STUN: öffentlich (z. B. Google STUN) – in manchen Umgebungen ausreichend.
- TURN: eigener TURN‑Server für restriktive NAT/Firewalls. Beachte Kosten/Bandbreite.

## Ausblick
- Fallbacks: Wenn P2P fehlt, zurück zum Server‑Routing.
- Privacy: Multipath/Onion‑like über vertrauenswürdige Peers möglich (siehe Gruppen‑Routing‑Ideen).

