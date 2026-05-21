const STORAGE_KEY = "msjAttarProducts";
const ADMIN_PIN = "7860";
const ADMIN_SESSION_KEY = "msjAttarAdminUnlocked";

const defaultProducts = [
  {
    id: "royal-oud",
    name: "Royal Oud Reserve",
    type: "Oud",
    size: "12ml",
    price: 3499,
    color: "#8b541d",
    featured: true,
    description: "A deep oud accord softened with amber, saffron, and sandalwood for a graceful evening signature.",
    ingredients: "Oud oil, amber, saffron, sandalwood"
  },
  {
    id: "rose-sultan",
    name: "Rose Sultan",
    type: "Floral",
    size: "6ml",
    price: 2199,
    color: "#8a2638",
    featured: true,
    description: "A regal rose attar layered with honeyed petals, musk, and a smooth woody base.",
    ingredients: "Damask rose, white musk, cedar, honey accord"
  },
  {
    id: "white-musk",
    name: "White Musk Noor",
    type: "Musk",
    size: "6ml",
    price: 1499,
    color: "#cbbf9b",
    featured: true,
    description: "Clean, intimate, and soft with a luminous musk profile for daily elegance.",
    ingredients: "White musk, iris, soft amber, clean woods"
  },
  {
    id: "saffron-amber",
    name: "Saffron Amber",
    type: "Spice",
    size: "12ml",
    price: 2999,
    color: "#b76518",
    featured: false,
    description: "Warm saffron, resinous amber, and gentle spice create a refined festive scent.",
    ingredients: "Saffron, amber resin, cinnamon, sandalwood"
  },
  {
    id: "zafran-mitti",
    name: "Zafran Mitti",
    type: "Fresh",
    size: "3ml",
    price: 999,
    color: "#81724a",
    featured: false,
    description: "Earth after first rain, brightened with saffron and a whisper of green freshness.",
    ingredients: "Mitti attar, saffron, vetiver, green accord"
  },
  {
    id: "oud-misk",
    name: "Oud Misk Elite",
    type: "Oud",
    size: "6ml",
    price: 2599,
    color: "#5f3a20",
    featured: false,
    description: "A balanced blend of aged oud and clean musk made for confident daily wear.",
    ingredients: "Aged oud, musk, tonka, cedarwood"
  },
  {
    id: "jasmine-night",
    name: "Jasmine Night",
    type: "Floral",
    size: "3ml",
    price: 1299,
    color: "#d7bd69",
    featured: false,
    description: "Nocturnal jasmine with creamy woods and a soft amber trail.",
    ingredients: "Jasmine sambac, amber, sandalwood, benzoin"
  },
  {
    id: "black-attar",
    name: "Black Attar Majlis",
    type: "Spice",
    size: "12ml",
    price: 3799,
    color: "#3a281a",
    featured: true,
    description: "A smoky, majestic blend built for gatherings, formal evenings, and collectors.",
    ingredients: "Smoked oud, black pepper, labdanum, patchouli"
  }
];

let products = loadProducts();
let selectedProduct = products[0];
const cart = new Map();
let isAdminUnlocked = sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: "0px 0px 80px 0px" });

const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];

function loadProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) && saved.length ? saved : defaultProducts;
  } catch {
    return defaultProducts;
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function applyAdminLock() {
  qs("#adminLock").classList.toggle("admin-hidden", isAdminUnlocked);
  qs(".manage-layout").classList.toggle("admin-hidden", !isAdminUnlocked);
  qs("#adminLockNote").textContent = isAdminUnlocked
    ? "Admin controls unlocked for this browser tab."
    : "Enter owner PIN to unlock listing controls.";
}

function requireAdmin() {
  if (isAdminUnlocked) return true;
  location.hash = "manage";
  showPage("manage");
  qs("#adminLockNote").textContent = "Please unlock with the admin PIN before changing listings.";
  qs("#adminPin").focus();
  return false;
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function productCard(product, compact = false) {
  const productVisual = product.image
    ? `<img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy">`
    : `<span class="mini-bottle"></span>`;

  return `
    <article class="product-card reveal" style="--product-color: ${escapeHTML(product.color)}">
      <button class="product-art" type="button" data-view-product="${escapeHTML(product.id)}" aria-label="View ${escapeHTML(product.name)}">
        ${productVisual}
      </button>
      <div class="product-meta">
        <span>${escapeHTML(product.type)}</span>
        <span>${escapeHTML(product.size)}</span>
      </div>
      <h3>${escapeHTML(product.name)}</h3>
      <p class="muted">${escapeHTML(compact ? product.description.slice(0, 76) + "..." : product.description)}</p>
      <div class="card-bottom">
        <strong class="price">${rupee.format(product.price)}</strong>
        <button class="button primary small-button" type="button" data-add-cart="${escapeHTML(product.id)}">Add</button>
      </div>
    </article>
  `;
}

function renderListings() {
  qs("#listingList").innerHTML = products.map((product) => `
    <article class="listing-item">
      <div>
        <strong>${escapeHTML(product.name)}</strong>
        <span>${escapeHTML(product.type)} - ${escapeHTML(product.size)} - ${rupee.format(product.price)}</span>
      </div>
      <div class="listing-actions">
        <button class="button ghost small-button" type="button" data-edit-product="${escapeHTML(product.id)}">Edit</button>
        <button class="button ghost small-button" type="button" data-delete-product="${escapeHTML(product.id)}">Delete</button>
      </div>
    </article>
  `).join("");
}

function resetListingForm() {
  qs("#listingForm").reset();
  qs("#productId").value = "";
  qs("#productColor").value = "#8b541d";
  qs("#photoPreview").innerHTML = "<span>No bottle photo selected</span>";
  qs("#saveListing").textContent = "Save Listing";
  qs("#listingNote").textContent = "Use image URLs now; later this can be connected to an admin backend and file upload.";
}

function fillListingForm(productId) {
  if (!requireAdmin()) return;
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  qs("#productId").value = product.id;
  qs("#productName").value = product.name;
  qs("#productPrice").value = product.price;
  qs("#productType").value = product.type;
  qs("#productSize").value = product.size;
  qs("#productDescription").value = product.description;
  qs("#productIngredients").value = product.ingredients;
  qs("#productImage").value = product.image?.startsWith("data:") ? "" : product.image || "";
  qs("#productColor").value = product.color || "#8b541d";
  qs("#productFeatured").checked = Boolean(product.featured);
  qs("#photoPreview").innerHTML = product.image
    ? `<img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)} preview">`
    : "<span>No bottle photo selected</span>";
  qs("#saveListing").textContent = "Update Listing";
  qs("#listingNote").textContent = "Editing selected listing. Save to update it everywhere.";
  location.hash = "manage";
  showPage("manage");
}

async function upsertListing(event) {
  event.preventDefault();
  if (!requireAdmin()) return;

  const existingId = qs("#productId").value;
  const name = qs("#productName").value.trim();
  const price = Number(qs("#productPrice").value);
  const id = existingId || `${slugify(name)}-${Date.now().toString(36)}`;
  const uploadedPhoto = qs("#productPhotoFile").files[0];
  const existingProduct = products.find((product) => product.id === existingId);
  const image = uploadedPhoto
    ? await fileToDataURL(uploadedPhoto)
    : qs("#productImage").value.trim() || existingProduct?.image || "";

  const listing = {
    id,
    name,
    price,
    type: qs("#productType").value,
    size: qs("#productSize").value,
    description: qs("#productDescription").value.trim(),
    ingredients: qs("#productIngredients").value.trim(),
    image,
    color: qs("#productColor").value,
    featured: qs("#productFeatured").checked
  };

  if (!listing.name || !listing.price || !listing.description || !listing.ingredients) {
    qs("#listingNote").textContent = "Please fill product name, price, description, and ingredients.";
    return;
  }

  products = existingId
    ? products.map((product) => product.id === existingId ? listing : product)
    : [listing, ...products];

  saveProducts();
  renderAllProducts();
  selectProduct(id);
  resetListingForm();
  qs("#listingNote").textContent = existingId ? "Listing updated successfully." : "Listing added successfully.";
}

function deleteListing(productId) {
  if (!requireAdmin()) return;
  products = products.filter((product) => product.id !== productId);
  saveProducts();
  cart.delete(productId);

  if (!products.length) {
    products = [...defaultProducts];
    saveProducts();
  }

  selectedProduct = products[0];
  renderAllProducts();
  selectProduct(selectedProduct.id);
  renderCart();
}

function renderAllProducts() {
  renderFeatured();
  renderCatalog();
  renderListings();
  applyAdminLock();
}

function renderFeatured() {
  qs("#featuredGrid").innerHTML = products
    .filter((product) => product.featured)
    .slice(0, 3)
    .map((product) => productCard(product, true))
    .join("");
}

function filterProducts() {
  const type = qs("#typeFilter").value;
  const size = qs("#sizeFilter").value;
  const price = qs("#priceFilter").value;

  return products.filter((product) => {
    const typeMatch = type === "all" || product.type === type;
    const sizeMatch = size === "all" || product.size === size;
    const priceMatch =
      price === "all" ||
      (price === "under1500" && product.price < 1500) ||
      (price === "1500to3000" && product.price >= 1500 && product.price <= 3000) ||
      (price === "over3000" && product.price > 3000);

    return typeMatch && sizeMatch && priceMatch;
  });
}

function renderCatalog() {
  const filtered = filterProducts();
  qs("#catalogGrid").innerHTML = filtered.length
    ? filtered.map((product) => productCard(product)).join("")
    : `<div class="glass-panel value-card"><strong>No attars found</strong><span>Try a different fragrance family, size, or price range.</span></div>`;
  observeReveals();
}

function selectProduct(productId) {
  selectedProduct = products.find((product) => product.id === productId) || products[0];
  if (!selectedProduct) return;
  qs("#detailName").textContent = selectedProduct.name;
  qs("#detailDescription").textContent = selectedProduct.description;
  qs("#detailIngredients").textContent = selectedProduct.ingredients;
  qs("#detailSize").textContent = selectedProduct.size;
  qs("#detailPrice").textContent = rupee.format(selectedProduct.price);
  qs("#detailImage").style.setProperty("--product-color", selectedProduct.color);
  qs("#detailImage").innerHTML = selectedProduct.image
    ? `<img src="${escapeHTML(selectedProduct.image)}" alt="${escapeHTML(selectedProduct.name)}">`
    : `<span>MSJ</span>`;
  qs("#detailCartButton").dataset.addCart = selectedProduct.id;

  qs("#thumbRow").innerHTML = [0, 1, 2]
    .map((index) => `<button class="thumb" type="button" style="--product-color: ${escapeHTML(selectedProduct.color)}" aria-label="${escapeHTML(selectedProduct.name)} view ${index + 1}"></button>`)
    .join("");

  const related = products
    .filter((product) => product.id !== selectedProduct.id && product.type === selectedProduct.type)
    .concat(products.filter((product) => product.id !== selectedProduct.id && product.type !== selectedProduct.type))
    .slice(0, 3);
  qs("#relatedGrid").innerHTML = related.map((product) => productCard(product, true)).join("");
  observeReveals();
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;
  const current = cart.get(productId) || { product, quantity: 0 };
  current.quantity += 1;
  cart.set(productId, current);
  renderCart();
}

function removeFromCart(productId) {
  cart.delete(productId);
  renderCart();
}

function cartTotals() {
  const items = [...cart.values()];
  return {
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  };
}

function renderCart() {
  const items = [...cart.values()];
  const { count, total } = cartTotals();

  qs("#cartCount").textContent = count;
  qs("#cartTotal").textContent = rupee.format(total);
  qs("#checkoutSubtotal").textContent = rupee.format(total);

  const itemMarkup = items.length
    ? items.map(({ product, quantity }) => `
      <div class="cart-item">
        <div>
          <strong>${escapeHTML(product.name)}</strong>
          <div class="muted">${quantity} x ${rupee.format(product.price)}</div>
        </div>
        <button class="button ghost small-button" type="button" data-remove-cart="${escapeHTML(product.id)}">Remove</button>
      </div>
    `).join("")
    : `<p class="muted">Your cart is waiting for a signature attar.</p>`;

  qs("#cartItems").innerHTML = itemMarkup;
  qs("#checkoutItems").innerHTML = itemMarkup;
}

function openCart() {
  qs("#cartDrawer").classList.add("open");
  qs("#cartDrawer").setAttribute("aria-hidden", "false");
}

function closeCart() {
  qs("#cartDrawer").classList.remove("open");
  qs("#cartDrawer").setAttribute("aria-hidden", "true");
}

function observeReveals() {
  qsa(".reveal:not(.visible)").forEach((element) => revealObserver.observe(element));
}

function currentView() {
  return (location.hash || "#home").replace("#", "") || "home";
}

function showPage(view = currentView()) {
  const sectionIds = qsa("main > section[id]").map((section) => section.id);
  const targetView = sectionIds.includes(view) ? view : "home";

  qsa("main > section").forEach((section) => {
    section.classList.toggle("view-hidden", section.id !== targetView);
  });

  qsa(".main-nav a").forEach((link) => {
    const linkView = link.getAttribute("href")?.replace("#", "");
    link.classList.toggle("active", linkView === targetView);
  });

  if (targetView === "home") {
    qsa(".main-nav a").forEach((link) => link.classList.remove("active"));
  }

  applyAdminLock();
  observeReveals();
  window.scrollTo({ top: 0, behavior: "auto" });
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-cart]");
  const viewButton = event.target.closest("[data-view-product]");
  const removeButton = event.target.closest("[data-remove-cart]");
  const editButton = event.target.closest("[data-edit-product]");
  const deleteButton = event.target.closest("[data-delete-product]");

  if (addButton) {
    addToCart(addButton.dataset.addCart);
    openCart();
  }

  if (viewButton) {
    selectProduct(viewButton.dataset.viewProduct);
    location.hash = "product";
    showPage("product");
  }

  if (removeButton) {
    removeFromCart(removeButton.dataset.removeCart);
  }

  if (editButton) {
    fillListingForm(editButton.dataset.editProduct);
  }

  if (deleteButton) {
    deleteListing(deleteButton.dataset.deleteProduct);
  }

  if (event.target.closest("[data-cart-open]")) openCart();
  if (event.target.closest("[data-cart-close]")) closeCart();

  if (event.target === qs("#cartDrawer")) closeCart();
});

qsa("#typeFilter, #sizeFilter, #priceFilter").forEach((filter) => {
  filter.addEventListener("change", renderCatalog);
});

qs("#resetFilters").addEventListener("click", () => {
  qs("#typeFilter").value = "all";
  qs("#sizeFilter").value = "all";
  qs("#priceFilter").value = "all";
  renderCatalog();
});

qs("#listingForm").addEventListener("submit", upsertListing);

qs("#clearListingForm").addEventListener("click", resetListingForm);

qs("#adminLock").addEventListener("submit", (event) => {
  event.preventDefault();
  if (qs("#adminPin").value === ADMIN_PIN) {
    isAdminUnlocked = true;
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    qs("#adminPin").value = "";
    applyAdminLock();
    observeReveals();
    return;
  }

  qs("#adminLockNote").textContent = "Wrong PIN. Please try again.";
});

qs("#resetDemoProducts").addEventListener("click", () => {
  if (!requireAdmin()) return;
  products = [...defaultProducts];
  saveProducts();
  cart.clear();
  selectedProduct = products[0];
  renderAllProducts();
  selectProduct(selectedProduct.id);
  renderCart();
  resetListingForm();
  qs("#listingNote").textContent = "Demo products restored.";
});

qs(".menu-toggle").addEventListener("click", () => {
  const nav = qs(".main-nav");
  const expanded = nav.classList.toggle("open");
  qs(".menu-toggle").setAttribute("aria-expanded", expanded.toString());
});

qsa(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    qs(".main-nav").classList.remove("open");
    qs(".menu-toggle").setAttribute("aria-expanded", "false");
  });
});

window.addEventListener("hashchange", () => showPage());

qs("#productPhotoFile").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) {
    qs("#photoPreview").innerHTML = "<span>No bottle photo selected</span>";
    return;
  }

  const image = await fileToDataURL(file);
  qs("#photoPreview").innerHTML = `<img src="${escapeHTML(image)}" alt="Selected bottle preview">`;
  qs("#productImage").value = "";
});

qs("#placeOrder").addEventListener("click", () => {
  qs("#orderNote").textContent = "Order preview confirmed. Connect this button to your payment gateway when ready.";
});

qs("#newsletterButton").addEventListener("click", () => {
  qs("#newsletterButton").textContent = "Subscribed";
});

renderAllProducts();
selectProduct(selectedProduct.id);
renderCart();
observeReveals();
showPage();
