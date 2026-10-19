// 1) The data. Each product is an object with a name and a price.
//    In Part 3 this list will come from Supabase instead.
const products = [
  { name: "Sparkler Pack", price: 50, description: "Safe handheld sparklers." },
  { name: "Fountain Cone", price: 120, description: "Sprays colorful sparks." },
  { name: "Rocket Set", price: 250, description: "Launches high with a bang." },
];

const CURRENCY = "PHP"; // change to USD, EUR, etc.
const money = new Intl.NumberFormat(undefined, { style: "currency", currency: CURRENCY });

// 2) Find the places on the page we want to change.
const gallery = document.getElementById("gallery");
const empty = document.getElementById("empty");
const search = document.getElementById("search");

// 3) A function that draws cards for a list of products.
function render(list) {
  gallery.replaceChildren(); // remove the old cards first
  empty.hidden = list.length > 0;

  for (const p of list) {
    const card = document.createElement("article");
    card.className = "card";

    const box = document.createElement("div");
    box.className = "video-box";
    box.textContent = "Video goes here";

    const name = document.createElement("p");
    name.className = "name";
    name.textContent = p.name;

    const price = document.createElement("p");
    price.className = "price";
    price.textContent = money.format(p.price);

    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = p.description;

    card.append(box, name, price, desc);
    gallery.append(card);
  }
}

// 4) Draw everything once when the page loads.
render(products);