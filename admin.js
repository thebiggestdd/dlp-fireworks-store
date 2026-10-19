const { SUPABASE_URL, SUPABASE_ANON_KEY, CURRENCY } = window.APP_CONFIG;
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (id) => document.getElementById(id);
const money = new Intl.NumberFormat(undefined, { style: "currency", currency: CURRENCY });

// null means "adding a new product". An id means "editing that product".
let editingId = null;

function say(text, isError = false) {
  $("message").textContent = text;
  $("message").style.color = isError ? "#fff3a8" : "white";
}

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
  resetForm();
  showCorrectView();
});

// Put the form back to "add a product" mode.
function resetForm() {
  editingId = null;
  $("addForm").reset();
  $("formTitle").textContent = "Add a product";
  $("saveBtn").textContent = "Add product";
  $("cancelBtn").hidden = true;
}

// Fill the form with an existing product so it can be changed.
function startEdit(p) {
  editingId = p.id;
  $("pname").value = p.name;
  $("pprice").value = p.price ?? "";
  $("pdesc").value = p.description ?? "";
  $("pcategory").value = p.category ?? "";
  $("pshape").value = p.shape === "vertical" ? "vertical" : "wide";
  $("pvideo").value = p.video_url ?? "";
  $("formTitle").textContent = `Editing: ${p.name}`;
  $("saveBtn").textContent = "Save changes";
  $("cancelBtn").hidden = false;
  $("formTitle").scrollIntoView({ behavior: "smooth", block: "center" });
  $("pname").focus();
}

$("cancelBtn").addEventListener("click", () => {
  resetForm();
  say("");
});

// One form, two jobs: add a new product, or save changes to the one being edited.
$("addForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const priceRaw = $("pprice").value;
  const fields = {
    name: $("pname").value.trim(),
    price: priceRaw === "" ? null : Number(priceRaw),
    description: $("pdesc").value.trim() || null,
    category: $("pcategory").value.trim() || null,
    shape: $("pshape").value,
    video_url: $("pvideo").value.trim() || null,
  };

  $("saveBtn").disabled = true;
  let error;

  if (editingId) {
    // .select() makes Supabase send back the changed rows, so we can tell if anything really changed.
    const res = await db.from("products").update(fields).eq("id", editingId).select();
    error = res.error;
    if (!error && res.data.length === 0) {
      error = { message: "Nothing was changed. Check the owner update rule in Supabase." };
    }
  } else {
    ({ error } = await db.from("products").insert(fields));
  }

  $("saveBtn").disabled = false;
  if (error) return say(`Couldn't save: ${error.message}`, true);

  say(editingId ? "Changes saved!" : "Product added!");
  resetForm();
  loadProducts();
});

async function loadProducts() {
  const { data, error } = await db.from("products").select("*").order("created_at", { ascending: false });
  if (error) return say(`Couldn't load products: ${error.message}`, true);

  // Suggest the categories you already use while typing a category.
  const names = [...new Set(data.map((p) => p.category).filter(Boolean))].sort();
  $("categoryList").replaceChildren(...names.map((n) => new Option(n)));

  $("list").replaceChildren();
  for (const p of data) {
    const item = document.createElement("div");
    item.className = "item";

    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = p.name;
    const sub = document.createElement("small");
    const price = p.price != null ? money.format(p.price) : "No price";
    sub.textContent = p.category ? `${price} · ${p.category}` : price;
    info.append(title, sub);

    const edit = document.createElement("button");
    edit.className = "pill light";
    edit.type = "button";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => startEdit(p));

    const del = document.createElement("button");
    del.className = "pill";
    del.type = "button";
    del.textContent = "Delete";
    del.addEventListener("click", async () => {
      if (!confirm(`Delete "${p.name}"?`)) return;
      const res = await db.from("products").delete().eq("id", p.id);
      if (res.error) return say(`Couldn't delete: ${res.error.message}`, true);
      if (editingId === p.id) resetForm();
      say("Deleted.");
      loadProducts();
    });

    const actions = document.createElement("div");
    actions.className = "item-actions";
    actions.append(edit, del);

    item.append(info, actions);
    $("list").append(item);
  }
}

showCorrectView();