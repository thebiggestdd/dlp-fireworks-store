// 1) Read our settings and create a connection ("client") to Supabase.
const { SUPABASE_URL, SUPABASE_ANON_KEY, CURRENCY } = window.APP_CONFIG;
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const money = new Intl.NumberFormat(undefined, { style: "currency", currency: CURRENCY });

// 2) Find the places on the page we want to change.
const gallery = document.getElementById("gallery");
const empty = document.getElementById("empty");
const search = document.getElementById("search");

// 3) Start with an empty list. It gets filled after we ask the database.
let products = [];

// 4) Draw cards for a list of products (same idea as before).
function render(list) {
  gallery.replaceChildren();
  empty.hidden = list.length > 0;
  empty.textContent = products.length ? "No product matches your search." : "No products yet.";

  for (const p of list) {
    const card = document.createElement("article");
    card.className = "card";

        // Only accept normal web links (blocks anything sneaky like "javascript:").
    const hasLink = p.video_url && /^https?:\/\//i.test(p.video_url);

    // If there's a link, the box becomes a clickable <a>; otherwise a plain <div>.
    const box = document.createElement(hasLink ? "a" : "div");
    box.className = "video-box";

    if (hasLink) {
      box.href = p.video_url;
      box.target = "_blank";                    // open in a new tab
      box.rel = "noopener noreferrer";
      box.setAttribute("aria-label", `Watch the video for ${p.name}`);

      const id = getYouTubeId(p.video_url);
      if (id) {
        const img = document.createElement("img");
        img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`; // YouTube's automatic cover
        img.alt = `Cover of the ${p.name} video`;
        img.loading = "lazy";
        box.append(img);
      } else {
        box.textContent = "Watch video";        // not a YouTube link, so no automatic cover
      }

      const play = document.createElement("span");
      play.className = "play";
      play.textContent = "▶";
      box.append(play);
    } else {
      box.textContent = "No video yet";
    }

    const name = document.createElement("p");
    name.className = "name";
    name.textContent = p.name;
    card.append(box, name);

    if (p.price != null) {
      const price = document.createElement("p");
      price.className = "price";
      price.textContent = money.format(p.price);
      card.append(price);
    }

    if (p.description) {
      const desc = document.createElement("p");
      desc.className = "desc";
      desc.textContent = p.description;
      card.append(desc);
    }

    gallery.append(card);
  }
}

// 5) Ask Supabase for every row in the products table, newest first.
async function loadProducts() {
  const { data, error } = await db
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    empty.hidden = false;
    empty.textContent = `Couldn't load products: ${error.message}`;
    return;
  }

  products = data;
  render(products);
}

// 6) Search, same as before.
search.addEventListener("input", () => {
  const text = search.value.trim().toLowerCase();
  render(products.filter((p) => p.name.toLowerCase().includes(text)));
});

loadProducts();