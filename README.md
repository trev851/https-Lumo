# https-Lumo
A web-based media player: https://https-lumo.onrender.com/

## When to use P2P streaming

Peer-to-peer (P2P) streaming can be a good choice when the video is shared by a trusted, authorized source and there are enough active peers to provide steady data. It can reduce reliance on one overloaded server, but playback quality depends on peer availability and your network.

Prefer a direct HTTP or HLS stream for the simplest, most reliable playback—especially on mobile, restricted networks, or a metered connection. P2P may use upload bandwidth as well as download bandwidth, can expose your network address to other peers, and may not work on networks that block peer connections. Only access or share media you have the right to use, and use P2P sources you trust.

**Lumo note:** Lumo currently plays browser-compatible HTTP/HLS stream URLs. A torrent/P2P source by itself is not playable in the browser; Lumo labels these sources “Torrent: not playable in a browser.” Choose a supported HTTP/HLS source, or open the P2P source in a player that explicitly supports it. This guidance does not mean Lumo currently downloads or streams torrents itself.
