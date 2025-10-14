# Gruppenchat

## MVP
- Gemeinsame Passphrase pro Raum → ein Gruppen‑Key.
- Sender verschlüsselt Nachricht mit Gruppen‑Key; Server broadcastet.
- Pro Nachricht neue Nonce; optional AAD mit `room` binden.

## Risiken
- Ein kompromittiertes Mitglied kompromittiert vergangene/future Nachrichten (kein Forward Secrecy im MVP).

## Verbesserungen
- Sender Keys (ein Sender erzeugt eigenen Langzeitschlüssel, verteilt verschlüsselt an Gruppenmitglieder; jede Nachricht mit Sender‑Key verschlüsselt → bessere Rotation und Wiederherstellung)
- MLS (IETF Messaging Layer Security): Baum‑basiertes Gruppen‑KMI mit effizienter Rekeying‑Struktur und Forward/Post‑Compromise Secrecy.
- Re‑Keying bei Beitritt/Austritt (Update des Gruppen‑Keys bzw. MLS‑Epoch)

## Routing über vertrauende User (Weiterentwicklung)
- Idee: Nachrichten werden hop‑by‑hop über vertrauenswürdige Peers weitergeleitet (Overlay), Ziel = Entlastung/Zensurresistenz.
- Schutz: Ende‑zu‑Ende‑Verschlüsselung beibehalten; optional zusätzliche Lagen (Onion‑ähnliche Hops).
- Herausforderungen: Latenz, Zuverlässigkeit, Peer‑Auswahl, Missbrauchsprävention.

