const { SUPABASE_URL, SUPABASE_ANON_KEY, CURRENCY } = window.APP_CONFIG;
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (id) => document.getElementById(id);
const money = new Intl.NumberFormat(undefined, { style: "currency", currency: CURRENCY });

function say(text, isError = false) {
  $("message").textContent = text;
  $("message").style.color = isError ? "#fff3a8" : "white";
}

// Show the login box if logged out, or the admin tools if logged in.
async function showCorrectView() {
  const { data } = await db.auth.getSession();
  $("loginView").hidden = !!data.session;
  $("adminView").hidden = !data.session;
  if (data.session) loadProducts();
}

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const { error } = await db.auth.signInWithPassword({
    email: $("email").value.trim(),
    password: $("password").value,
  });
  if (error) return say(`Login failed: ${error.message}`, true);
  say("");
  $("password").value = "";
  showCorrectView();
});

$("logoutBtn").addEventListener("click", async () => {
  await db.auth.signOut();
  showCorrectView();
});

$("addForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const priceRaw = $("pprice").value;
  const { error } = await db.from("products").insert({
    name: $("pname").value.trim(),
    price: priceRaw === "" ? null : Number(priceRaw),
    description: $("pdesc").value.trim() || null,
    video_url: $("pvideo").value.trim() || null,
  });
  if (error) return say(`Couldn't add: ${error.message}`, true);
  $("addForm").reset();
  say("Product added!");
  loadProducts();
});

async function loadProducts() {
  const { data, error } = await db.from("products").select("*").order("created_at", { ascending: false });
  if (error) return say(`Couldn't load products: ${error.message}`, true);

  $("list").replaceChildren();
  for (const p of data) {
    const item = document.createElement("div");
    item.className = "item";

    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = p.name;
    const sub = document.createElement("span");
    sub.textContent = p.price != null ? money.format(p.price) : "No price";
    info.append(title, sub);

    const del = document.createElement("button");
    del.className = "pill";
    del.type = "button";
    del.textContent = "Delete";
    del.addEventListener("click", async () => {
      if (!confirm(`Delete "${p.name}"?`)) return;
      const { error } = await db.from("products").delete().eq("id", p.id);
      if (error) return say(`Couldn't delete: ${error.message}`, true);
      say("Deleted.");
      loadProducts();
    });

    item.append(info, del);
    $("list").append(item);
  }
}

showCorrectView();