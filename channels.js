/* channels.js - master channels list
   عدّل هذا الملف يومياً فقط، ضع روابط m3u8 أو mp4 داخل src.
   تنسيقات المقبولة: HLS (.m3u8) - MP4 - DASH (إن اردت).
   كل قناة: key يتطابق مع href="go:key" في الواجهة.
*/

window.channels = {

  /* ---------------- Sports ---------------- */
  "b1": {
    title: "beIN Sports 1",
    qualities: [
      { label: "360p", src: "" },
      { label: "480p", src: "" },
      { label: "720p HD", src: "" },
      { label: "1080p FHD", src: "" }
    ]
  },

  "b2": {
    title: "beIN Sports 2",
    qualities: [
      { label: "360p", src: "" },
      { label: "480p", src: "" },
      { label: "720p HD", src: "" }
    ]
  },

  "b3": { title: "beIN Sports 3", qualities: [ { label: "Auto", src: "" } ] },
  "b4": { title: "beIN Sports 4", qualities: [ { label: "Auto", src: "" } ] },
  "b5": { title: "beIN Sports 5", qualities: [ { label: "Auto", src: "" } ] },
  "b6": { title: "beIN Sports 6", qualities: [ { label: "Auto", src: "" } ] },
  "b7": { title: "beIN Sports 7", qualities: [ { label: "Auto", src: "" } ] },
  "b8": { title: "beIN 1 Extra", qualities: [ { label: "Auto", src: "" } ] },
  "b9": { title: "beIN 2 Extra", qualities: [ { label: "Auto", src: "" } ] },

  "s4": { title: "THMANYAH 1", qualities: [ { label: "Auto", src: "" } ] },
  "s5": { title: "THMANYAH 2", qualities: [ { label: "Auto", src: "" } ] },

  "a1": { title: "AD Sports 1", qualities: [ { label: "Auto", src: "" } ] },
  "a2": { title: "AD Sports 2", qualities: [ { label: "Auto", src: "" } ] },

  "iraq": { title: "Iraq Sport", qualities: [ { label: "480p", src: "" }, { label: "720p HD", src: "" } ] },

  /* ---------------- Entertainment ---------------- */
  "ent1": { title: "Iraqi TV", qualities: [ { label: "Auto", src: "" } ] },
  "ent2": { title: "Al Sumaria", qualities: [ { label: "Auto", src: "" } ] },
  "ent3": { title: "Abu Dhani International", qualities: [ { label: "Auto", src: "" } ] },
  "ent4": { title: "Al Ahad", qualities: [ { label: "Auto", src: "" } ] },
  "ent5": { title: "Dijlah", qualities: [ { label: "Auto", src: "" } ] },

  /* ---------------- News ---------------- */
  "news1": { title: "Iraqi News", qualities: [ { label: "Auto", src: "" } ] },
  "news2": { title: "Al Sharqiya News", qualities: [ { label: "Auto", src: "" } ] },
  "news3": { title: "Al Hadath", qualities: [ { label: "Auto", src: "" } ] },
  "news4": { title: "Al Jazeera", qualities: [ { label: "Auto", src: "" } ] },
  "news5": { title: "Al Arabiya", qualities: [ { label: "Auto", src: "" } ] },

  /* ---------------- Movies ---------------- */
  "e1": { title: "beIN Movies Premiere 1", qualities: [ { label: "Auto", src: "" } ] },
  "e2": { title: "beIN Movies Action 2", qualities: [ { label: "Auto", src: "" } ] },
  "e3": { title: "beIN Movies Family 3", qualities: [ { label: "Auto", src: "" } ] },
  "e4": { title: "beIN Movies Drama 4", qualities: [ { label: "Auto", src: "" } ] },

  /* ---------------- Religious ---------------- */
  "n16": { title: "Karbala TV", qualities: [ { label: "Auto", src: "" } ] },
  "n17": { title: "Al Shaair TV", qualities: [ { label: "Auto", src: "" } ] },
  "n15": { title: "Al Anwar TV", qualities: [ { label: "Auto", src: "" } ] },
  "n5": { title: "Makkah TV", qualities: [ { label: "Auto", src: "" } ] },
  "n6": { title: "Imam Hussain 2 TV", qualities: [ { label: "Auto", src: "" } ] },

  /* ---------------- Kids ---------------- */
  "f5": { title: "Spacetoon", qualities: [ { label: "Auto", src: "" } ] },
  "e5": { title: "Cartoon Network", qualities: [ { label: "Auto", src: "" } ] },
  "f6": { title: "Taha TV", qualities: [ { label: "Auto", src: "" } ] },
  "f4": { title: "Majid TV", qualities: [ { label: "Auto", src: "" } ] },
  "f3": { title: "Jeem TV", qualities: [ { label: "Auto", src: "" } ] }

}; // end window.channels
