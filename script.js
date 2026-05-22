const SUPABASE_URL = "https://xpnfzmwrcxwpxgoaqpeh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbmZ6bXdyY3h3cHhnb2FxcGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNjc2NjYsImV4cCI6MjA5NDk0MzY2Nn0.MMkibPkw-OY_iUgKUTNli1lNXI6NEF26xTtM8Fva6ow";
const PRODUCT_IMAGE_BUCKET = "product-images";
const CONTACT_EMAIL = "its.msj.work@gmail.com";
const CONTACT_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;
const OWNER_WHATSAPP = "919480169422";
const ORDER_STATUSES = ["new", "confirmed", "packed", "shipped", "delivered", "cancelled"];
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

let products = [...defaultProducts];
let selectedProduct = products[0];
const cart = new Map();
let isAdminUnlocked = false;
let orders = [];
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
const listen = (selector, event, handler) => {
  const element = typeof selector === "string" ? qs(selector) : selector;
  if (element) element.addEventListener(event, handler);
};

function applyAdminLock() {
  qs("#adminLock")?.classList.toggle("admin-hidden", isAdminUnlocked);
  qs(".manage-layout")?.classList.toggle("admin-hidden", !isAdminUnlocked);
  if (qs("#adminLockNote")) {
    qs("#adminLockNote").textContent = isAdminUnlocked
      ? "Admin controls unlocked. Changes will save to Supabase."
      : "Sign in with the Supabase admin account to unlock listing controls.";
  }
}

function requireAdmin() {
  if (isAdminUnlocked) return true;
  location.hash = "manage";
  showPage("manage");
  if (qs("#adminLockNote")) qs("#adminLockNote").textContent = "Please sign in before changing listings.";
  qs("#adminEmail")?.focus();
  return false;
}

function fromSupabaseProduct(product) {
  return {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    type: product.type,
    size: product.size,
    description: product.description,
    ingredients: product.ingredients,
    image: product.image_url || "",
    color: product.color || "#8b541d",
    featured: Boolean(product.featured)
  };
}

function toSupabaseProduct(product) {
  return {
    name: product.name,
    price: product.price,
    type: product.type,
    size: product.size,
    description: product.description,
    ingredients: product.ingredients,
    image_url: product.image,
    color: product.color,
    featured: product.featured
  };
}

async function loadProductsFromSupabase() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Supabase load failed:", error.message);
    qs("#listingNote").textContent = "Could not load Supabase products yet. Check table policies.";
    products = [...defaultProducts];
  } else {
    products = data.length ? data.map(fromSupabaseProduct) : [...defaultProducts];
  }

  selectedProduct = products[0];
  renderAllProducts();
  selectProduct(selectedProduct.id);
  renderCart();
}

function fromSupabaseOrder(order) {
  return {
    id: order.id,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    city: order.city,
    address: order.address,
    delivery: order.delivery_method,
    payment: order.payment_method,
    items: Array.isArray(order.items) ? order.items : [],
    total: Number(order.total_amount || 0),
    status: order.status || "new",
    createdAt: order.created_at
  };
}

function buildWhatsAppOrderMessage(order) {
  const lines = order.items
    .map((item) => `- ${item.name} x ${item.quantity} (${rupee.format(item.price * item.quantity)})`)
    .join("\n");

  return [
    "New MSJ Attar Order",
    "",
    `Name: ${order.customerName}`,
    `Phone: ${order.customerPhone}`,
    `Email: ${order.customerEmail}`,
    `City: ${order.city || ""}`,
    `Address: ${order.address}`,
    "",
    "Items:",
    lines,
    "",
    `Total: ${rupee.format(order.total)}`,
    `Delivery: ${order.delivery}`,
    `Payment: ${order.payment}`,
    `Status: ${order.status}`
  ].join("\n");
}

function whatsappOrderUrl(order) {
  return `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(buildWhatsAppOrderMessage(order))}`;
}

async function loadOrdersFromSupabase() {
  if (!isAdminUnlocked) {
    renderOrders();
    return;
  }

  const { data, error } = await supabaseClient
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    qs("#ordersNote").textContent = `Could not load orders: ${error.message}`;
    orders = [];
  } else {
    orders = data.map(fromSupabaseOrder);
    qs("#ordersNote").textContent = orders.length
      ? "Latest customer orders from Supabase."
      : "No orders yet.";
  }

  renderOrders();
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadProductPhoto(file) {
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const { error } = await supabaseClient.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabaseClient.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
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
  const uploadedPhoto = qs("#productPhotoFile").files[0];
  const existingProduct = products.find((product) => product.id === existingId);
  qs("#listingNote").textContent = uploadedPhoto ? "Uploading bottle photo..." : "Saving listing...";

  let image = qs("#productImage").value.trim() || existingProduct?.image || "";
  if (uploadedPhoto) {
    try {
      image = await uploadProductPhoto(uploadedPhoto);
    } catch (error) {
      qs("#listingNote").textContent = `Photo upload failed: ${error.message}`;
      return;
    }
  }

  const listing = {
    id: existingId,
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

  const payload = toSupabaseProduct(listing);
  const result = existingId
    ? await supabaseClient.from("products").update(payload).eq("id", existingId).select().single()
    : await supabaseClient.from("products").insert(payload).select().single();

  if (result.error) {
    qs("#listingNote").textContent = `Save failed: ${result.error.message}`;
    return;
  }

  await loadProductsFromSupabase();
  selectProduct(result.data.id);
  resetListingForm();
  qs("#listingNote").textContent = existingId ? "Listing updated successfully." : "Listing added successfully.";
}

function deleteListing(productId) {
  if (!requireAdmin()) return;
  supabaseClient.from("products").delete().eq("id", productId).then(async ({ error }) => {
    if (error) {
      qs("#listingNote").textContent = `Delete failed: ${error.message}`;
      return;
    }

    cart.delete(productId);
    await loadProductsFromSupabase();
  });
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

function renderOrders() {
  const ordersList = qs("#ordersList");
  if (!ordersList) return;

  if (!isAdminUnlocked) {
    ordersList.innerHTML = `<div class="order-card"><strong>Admin login required</strong><span>Sign in above to view customer orders.</span></div>`;
    return;
  }

  ordersList.innerHTML = orders.length
    ? orders.map((order) => `
      <article class="order-card">
        <div class="listing-head">
          <strong>${escapeHTML(order.customerName)}</strong>
          <span>${rupee.format(order.total)}</span>
        </div>
        <span>${escapeHTML(order.customerPhone)} - ${escapeHTML(order.city || "")}</span>
        <small>${escapeHTML(order.customerEmail)} - ${new Date(order.createdAt).toLocaleString("en-IN")}</small>
        <small>${escapeHTML(order.address)}</small>
        <small>${escapeHTML(order.delivery)} - ${escapeHTML(order.payment)}</small>
        <div class="order-lines">
          ${order.items.map((item) => `<small>${escapeHTML(item.name)} x ${item.quantity} - ${rupee.format(item.price * item.quantity)}</small>`).join("")}
        </div>
        <div class="order-actions">
          <label>Status
            <select data-order-status="${escapeHTML(order.id)}">
              ${ORDER_STATUSES.map((status) => `<option value="${status}" ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}
            </select>
          </label>
          <a class="button ghost small-button" href="${whatsappOrderUrl(order)}" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </article>
    `).join("")
    : `<div class="order-card"><strong>No orders yet</strong><span>Customer orders will appear here after checkout.</span></div>`;
}

async function submitOrder(event) {
  event.preventDefault();
  const { count, total } = cartTotals();

  if (!count) {
    qs("#orderNote").textContent = "Please add at least one product to cart before placing an order.";
    return;
  }

  const items = [...cart.values()].map(({ product, quantity }) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    quantity,
    size: product.size,
    type: product.type
  }));

  const payload = {
    customer_name: qs("#checkoutName").value.trim(),
    customer_email: qs("#checkoutEmail").value.trim(),
    customer_phone: qs("#checkoutPhone").value.trim(),
    city: qs("#checkoutCity").value.trim(),
    address: qs("#checkoutAddress").value.trim(),
    delivery_method: qs("#checkoutDelivery").value,
    payment_method: qs("#checkoutPayment").value,
    items,
    total_amount: total,
    status: "new"
  };

  if (!payload.customer_name || !payload.customer_email || !payload.customer_phone || !payload.address || !payload.city) {
    qs("#orderNote").textContent = "Please fill name, email, phone, city, and address.";
    return;
  }

  qs("#orderNote").textContent = "Placing order...";
  const { error } = await supabaseClient.from("orders").insert(payload);
  if (error) {
    qs("#orderNote").textContent = `Order failed: ${error.message}`;
    return;
  }

  cart.clear();
  renderCart();
  qs("#checkoutForm").reset();
  qs("#orderNote").textContent = "Order placed successfully. We will contact you soon.";
  await loadOrdersFromSupabase();
}

async function updateOrderStatus(orderId, status) {
  if (!requireAdmin()) return;

  const { error } = await supabaseClient
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    qs("#ordersNote").textContent = `Status update failed: ${error.message}`;
    return;
  }

  qs("#ordersNote").textContent = "Order status updated.";
  await loadOrdersFromSupabase();
}

async function submitContactForm(event) {
  event.preventDefault();
  const note = qs("#contactNote");
  const name = qs("#contactName").value.trim();
  const email = qs("#contactEmail").value.trim();
  const message = qs("#contactMessage").value.trim();

  if (!name || !email || !message) {
    note.textContent = "Please fill name, email, and message.";
    return;
  }

  note.textContent = "Sending message...";

  try {
    const response = await fetch(CONTACT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        message,
        _subject: `MSJ Attar contact from ${name}`,
        _template: "table",
        _captcha: "false"
      })
    });

    if (!response.ok) throw new Error("Message service is not ready yet.");

    qs("#contactForm").reset();
    note.textContent = "Message sent successfully. We will contact you soon.";
  } catch (error) {
    const subject = encodeURIComponent(`MSJ Attar contact from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    note.textContent = "Opening email app to send your message.";
  }
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
  if (targetView === "manage") loadOrdersFromSupabase();
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

document.addEventListener("change", (event) => {
  const statusSelect = event.target.closest("[data-order-status]");
  if (statusSelect) {
    updateOrderStatus(statusSelect.dataset.orderStatus, statusSelect.value);
  }
});

qsa("#typeFilter, #sizeFilter, #priceFilter").forEach((filter) => {
  filter.addEventListener("change", renderCatalog);
});

listen("#resetFilters", "click", () => {
  qs("#typeFilter").value = "all";
  qs("#sizeFilter").value = "all";
  qs("#priceFilter").value = "all";
  renderCatalog();
});

listen("#listingForm", "submit", upsertListing);

listen("#clearListingForm", "click", resetListingForm);

listen("#adminLock", "submit", async (event) => {
  event.preventDefault();
  qs("#adminLockNote").textContent = "Signing in...";
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: qs("#adminEmail").value.trim(),
    password: qs("#adminPassword").value
  });

  if (!error) {
    isAdminUnlocked = true;
    qs("#adminPassword").value = "";
    applyAdminLock();
    loadOrdersFromSupabase();
    observeReveals();
    return;
  }

  qs("#adminLockNote").textContent = `Sign in failed: ${error.message}`;
});

listen("#adminSignOut", "click", async () => {
  await supabaseClient.auth.signOut();
  isAdminUnlocked = false;
  orders = [];
  applyAdminLock();
  renderOrders();
  resetListingForm();
});

listen(".menu-toggle", "click", () => {
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

listen(window, "hashchange", () => showPage());

listen("#productPhotoFile", "change", async (event) => {
  const file = event.target.files[0];
  if (!file) {
    qs("#photoPreview").innerHTML = "<span>No bottle photo selected</span>";
    return;
  }

  const image = await fileToDataURL(file);
  qs("#photoPreview").innerHTML = `<img src="${escapeHTML(image)}" alt="Selected bottle preview">`;
  qs("#productImage").value = "";
});

listen("#checkoutForm", "submit", submitOrder);

listen("#refreshOrders", "click", loadOrdersFromSupabase);

listen("#contactForm", "submit", submitContactForm);

listen("#newsletterButton", "click", () => {
  qs("#newsletterButton").textContent = "Subscribed";
});

async function initApp() {
  const { data } = await supabaseClient.auth.getSession();
  isAdminUnlocked = Boolean(data.session);
  renderAllProducts();
  selectProduct(selectedProduct.id);
  renderCart();
  renderOrders();
  observeReveals();
  showPage();
  await loadProductsFromSupabase();
  await loadOrdersFromSupabase();
}

initApp();
