async function isYouTubeLive(channelUrl, username) {
  try {
    const res = await fetch(
      `https://youtube-stream-checker.vercel.app/api/check-live?url=${encodeURIComponent(channelUrl)}&username=${encodeURIComponent(username)}`
    );
    const data = await res.json();
    return data.live;
  } catch (err) {
    console.error("YouTube canlı kontrol hatası:", err);
    return false;
  }
}

async function isKickLive(username) {
  try {
    const res = await fetch(`https://kick.com/api/v1/channels/${username}`);
    const data = await res.json();
    return data.livestream !== null;
  } catch (err) {
    console.error("Kick canlı kontrol hatası:", err);
    return false;
  }
}

function extractKickUsername(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[0]?.toLowerCase() || "";
  } catch (err) {
    return "";
  }
}

function getPlatformIcon(platform) {
  if (platform === "kick") return "kk.png";
  if (platform === "youtube") return "yt.png";
  return "media.png";
}

function getPlatformLabel(platform, channel) {
  if (platform === "kick") return "Kick Yayıncısı";
  if (platform === "youtube") return "YouTube Yayıncısı";
  return channel.platform || "İçerik Üreticisi";
}

function createCard(channel, isLive, platform) {
  const card = document.createElement("div");
  card.className = "channel-card";

  const icon = getPlatformIcon(platform);
  const label = getPlatformLabel(platform, channel);
  const badge = platform === "icerik"
    ? ""
    : isLive
      ? `<span class="live-badge">● CANLI</span>`
      : `<span class="offline-badge">● OFFLINE</span>`;

  card.innerHTML = `
    <img class="channel-icon" src="${icon}" alt="${platform}">
    <div class="channel-main">
      <div class="channel-top">
        <div class="channel-name">${channel.name}</div>
        ${badge}
      </div>
      <div class="channel-platform">${label}</div>
      <a class="channel-link" href="${channel.url}" target="_blank" rel="noopener noreferrer">
        Kanala Git
      </a>
    </div>
  `;

  return card;
}

async function loadChannels() {
  try {
    const res = await fetch("channels.json");
    const data = await res.json();

    const youtubeList = document.querySelector(".youtube-list");
    const kickList = document.querySelector(".kick-list");
    const icerikList = document.querySelector(".icerik-list");

    youtubeList.innerHTML = "";
    kickList.innerHTML = "";
    icerikList.innerHTML = "";

    const youtubeStatuses = await Promise.all(
      data.youtube.map(async (channel) => {
        const isLive = await isYouTubeLive(channel.url.trim(), channel.name.trim());
        return { ...channel, isLive };
      })
    );

    const orderedYoutube = [
      ...youtubeStatuses.filter((c) => c.isLive),
      ...youtubeStatuses.filter((c) => !c.isLive),
    ];

    orderedYoutube.forEach((channel) => {
      youtubeList.appendChild(createCard(channel, channel.isLive, "youtube"));
    });

    const kickStatuses = await Promise.all(
      data.kick.map(async (channel) => {
        const username = extractKickUsername(channel.url);
        const isLive = username ? await isKickLive(username) : false;
        return { ...channel, isLive };
      })
    );

    const orderedKick = [
      ...kickStatuses.filter((c) => c.isLive),
      ...kickStatuses.filter((c) => !c.isLive),
    ];

    orderedKick.forEach((channel) => {
      kickList.appendChild(createCard(channel, channel.isLive, "kick"));
    });

    data.icerik.forEach((channel) => {
      icerikList.appendChild(createCard(channel, false, "icerik"));
    });
  } catch (err) {
    console.error("Kanal listesi yüklenemedi:", err);
  }
}

loadChannels();
