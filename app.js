const { SUPABASE_URL, SUPABASE_ANON_KEY, CURRENCY } = window.APP_CONFIG;
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const money = new Intl.NumberFormat(undefined, { style: "currency", currency: CURRENCY });

const gallery = document.getElementById("gallery");
const empty = document.getElementById("empty");
const search = document.getElementById("search");
const categorySelect = document.getElementById("category");

let products = [];

// Build the dropdown from the categories that exist. Hide it if there are none.
function fillCategories() {
  const current = categorySelect.value;
  const names = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();

  categorySelect.replaceChildren(new Option("All categories", ""));
  for (const n of names) categorySelect.append(new Option(n, n));

  categorySelect.value = names.includes(current) ? current : "";
  categorySelect.hidden = names.length === 0;
}

// Apply BOTH the search text and the chosen category.
function visibleProducts() {
  const text = search.value.trim().toLowerCase();
  const cat = categorySelect.value;
  return products.filter(
    (p) => (!cat || p.category === cat) && p.name.toLowerCase().includes(text)
  );
}

function render() {
  const list = visibleProducts();
  gallery.replaceChildren();
  empty.hidden = list.length > 0;
  empty.textContent = products.length ? "No product matches your search." : "No products yet.";

  for (const p of list) {
    const card = document.createElement("article");
    card.className = "card";

    // Only accept normal web links (blocks anything sneaky like "javascript:").
    const hasLink = p.video_url && /^https?:\/\//i.test(p.video_url);

    // With a link the box is a clickable <a>, otherwise a plain <div>.
    const box = document.createElement(hasLink ? "a" : "div");
    box.className = `video-box ${p.shape === "vertical" ? "vertical" : "wide"}`;

    if (hasLink) {
      box.href = p.video_url;
      box.target = "_blank";
      box.rel = "noopener noreferrer";
      box.setAttribute("aria-label", `Watch the video for ${p.name}`);

      const id = getYouTubeId(p.video_url);
      if (id) {
        const img = document.createElement("img");
        img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        img.alt = `Cover of the ${p.name} video`;
        img.loading = "lazy";
        box.append(img);
      } else {
        box.textContent = "Watch video";
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

async function loadProducts() {
  const { data, error } = await db.from("products").select("*").order("created_at", { ascending: false });
  if (error) {
    empty.hidden = false;
    empty.textContent = `Couldn't load products: ${error.message}`;
    return;
  }
  products = data;
  fillCategories();
  render();
}

search.addEventListener("input", render);
categorySelect.addEventListener("change", render);

loadProducts();