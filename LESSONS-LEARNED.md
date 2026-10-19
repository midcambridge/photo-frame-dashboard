# Lessons learned: PF1007L (May `20260529`) to a self-hosted dashboard

A record of one owner's setup, from a locked frame to a kiosk serving this repo's dashboard from a
Raspberry Pi on the home network. It adds to the guides in `docs/` and doesn't replace them. Start
with [`docs/pf1007l-start-here.md`](docs/pf1007l-start-here.md).

## Route that worked

1. **T3c with a Pi hotspot instead of a router DNS change.** NetworkManager's `ipv4.method shared` hotspot runs its own dnsmasq. One line in `/etc/NetworkManager/dnsmasq-shared.d/` redirects `imsconnect.efercro.com` to the Pi (`10.42.0.1`). The frame logged in as soon as it joined.
2. **Persistent root USB ADB** via `persist.sys.usb.config=mass_storage,adb` (see issue #163). It survived a 15 s power cut.
3. **Full eMMC backup over ADB**, then WebView 106 (guide section 6), Rootless as a fallback launcher, the kiosk as Home, and AiMOR disabled.
4. **Hosting:** `dashboard/dist` served over plain HTTP by a systemd unit on an always-on Pi. The frame reloads itself when a new build is deployed.

## Lessons

| Lesson | Detail |
|---|---|
| "Activation successful" can be a lie | NetworkManager reports success *before* the hotspot's dnsmasq starts. If port 53 is taken (here by a forgotten Pi-hole), the connection fails a second later and falls back to the old Wi-Fi. Check `ss -lunp \| grep :53` first. |
| Run the hotspot locally | A Pi with one Wi-Fi radio drops its home Wi-Fi when the hotspot starts. Don't start it over SSH. |
| `server.py --seconds` maxes out at 600 | Larger values are rejected. |
| Turn network ADB off with `adb usb` | Safer than `stop adbd; start adbd` from inside an ADB shell, which can kill the shell before `start` runs. |
| Back up before anything else, and verify per chunk | 64 MiB chunks with `/sbin/busybox dd`, each compared with the frame's own `busybox md5sum` of a second read. About 40 min for 15.6 GB on USB 2. A copy on a NAS, re-verified, is cheap insurance. |
| A live `/data` isn't crash-consistent | Read-only partitions (system, boot, recovery) back up exactly. `/data` is mounted read-write while Android runs. |
| Check saved Wi-Fi networks on a "new" frame | This unit shipped with an unknown saved network. Remove it before the frame goes online. |
| Don't trust the WebView version number alone | After the swap, confirm a real page renders. A dark screen on WebView 44 meant the CSS loaded but the Chrome-106 JavaScript didn't run. |
| The kiosk isn't a Home app until you enable it | Run `--ez home true` to enable the `.Home` alias, then pick it in **Settings → Home**. The radio button saves it; the trash icon uninstalls. |
| The kiosk ignores a new URL while it's running | `am force-stop com.wesbos.homehq` before `am start ... --es url`. |
| The demo pins its clock to 3:18 PM | `App.setTime(15, 18)` in `dashboard/js/app.js`. Remove it to show real time. |
| Make deploys hands-free | `dashboard/js/update.js` fetches the page at :03 and :33 and reloads if the hashed script name changed. Compare names exactly, not as substrings. |
| The newer browser lies | WebView 106 lacks `oklch()`, `color-mix()`, CSS nesting and `:has()`. Check visual changes on the frame. |
| Plain LAN HTTP avoids certificate work | Old trust stores reject some HTTPS sites. Serving from a home Pi needs no CA changes. |
| The clock sets itself once the frame is online | With no network it boots to 1969. On Wi-Fi with `auto_time=1`, it corrected itself. |

## Keep private

Never commit `backups/` or `diagnostics/`. Never publish the serial, MAC addresses, Wi-Fi details or
whole-eMMC hashes.
