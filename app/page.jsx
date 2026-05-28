"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

const PRODUCT_IMAGE_BUCKET = "product-images";
const CONTACT_EMAIL = "its.msj.work@gmail.com";
const ADMIN_EMAIL = "its.msj.work@gmail.com";
const CONTACT_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;
const OWNER_WHATSAPP = "919480169422";
const ORDER_STATUSES = ["new", "confirmed", "packed", "shipped", "delivered", "cancelled"];
const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

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

const emptyListing = {
  id: "",
  name: "",
  type: "Oud",
  size: "6ml",
  price: "",
  color: "#8b541d",
  description: "",
  ingredients: "",
  image: "",
  featured: false
};

const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

function toId(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
    id: product.id,
    name: product.name,
    price: Number(product.price),
    type: product.type,
    size: product.size,
    description: product.description,
    image_url: product.image,
    color: product.color,
    featured: product.featured
  };
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
    total: Number(order.total_amount) || 0,
    status: order.status || "new",
    createdAt: order.created_at
  };
}

// Robust Email Validation Regex Helper
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase().trim());
}

function ProductArt({ product }) {
  if (product.image) {
    return (
      <div className="product-art image-art">
        <img src={product.image} alt={product.name} />
      </div>
    );
  }

  return (
    <div className="product-art" style={{ "--product": product.color }}>
      <div className="mini-bottle" style={{ border: `1.5px solid ${product.color}` }}>
        <span>MSJ</span>
        <small>{product.size}</small>
      </div>
    </div>
  );
}

function Section({ id, view, className = "", children }) {
  return (
    <section id={id} className={`section-band ${className} ${view !== id ? "view-hidden" : ""}`}>
      {children}
    </section>
  );
}

/* BAKHUR CANVAS PARTICLE SYSTEM: SMOKE, GOLD DUST & RED EMBER SPARKS */
function BakhurCanvas({ isActive = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    const smokeParticles = [];
    const maxSmoke = 20;

    const goldParticles = [];
    const maxGold = 30;

    const emberSparks = [];
    const maxEmbers = 25; // Burning sparks from bottom rock pedestal

    class SmokeParticle {
      constructor() {
        this.reset();
        this.y = height * (0.3 + Math.random() * 0.7);
      }

      reset() {
        this.x = width / 2 + (Math.random() * 40 - 20);
        this.y = height + Math.random() * 30;
        this.vy = -0.4 - Math.random() * 0.5;
        this.vx = Math.random() * 0.2 - 0.1;
        this.life = 0;
        this.maxLife = 220 + Math.random() * 100;
        this.size = 20 + Math.random() * 15;
        this.maxSize = 90 + Math.random() * 30;
        this.opacity = 0;
        this.wobbleSpeed = 0.006 + Math.random() * 0.01;
        this.wobbleAmp = 0.4 + Math.random() * 0.5;
        this.seed = Math.random() * 100;
      }

      update() {
        this.y += this.vy;
        this.x += this.vx + Math.sin(this.life * this.wobbleSpeed + this.seed) * this.wobbleAmp;
        this.life++;

        this.size = this.size + (this.maxSize - this.size) * 0.005;

        if (this.life < 70) {
          this.opacity = (this.life / 70) * 0.055;
        } else {
          this.opacity = 0.055 * (1 - (this.life - 70) / (this.maxLife - 70));
        }

        if (this.life >= this.maxLife || this.y < -this.size) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size
        );
        gradient.addColorStop(0, `rgba(249, 235, 172, ${this.opacity})`);
        gradient.addColorStop(0.3, `rgba(212, 175, 55, ${this.opacity * 0.4})`);
        gradient.addColorStop(1, "rgba(5, 4, 3, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    class GoldParticle {
      constructor() {
        this.reset();
        this.y = Math.random() * height;
      }

      reset() {
        this.x = Math.random() * width;
        this.y = height + Math.random() * 20;
        this.vy = -0.4 - Math.random() * 0.8;
        this.vx = Math.random() * 0.4 - 0.2;
        this.size = 0.7 + Math.random() * 1.5;
        this.opacity = 0.15 + Math.random() * 0.6;
        this.sparkleSpeed = 0.015 + Math.random() * 0.03;
        this.seed = Math.random() * 15;
      }

      update() {
        this.y += this.vy;
        this.x += this.vx;
        this.opacity = Math.max(0.1, Math.min(0.9, this.opacity + Math.sin(Date.now() * this.sparkleSpeed + this.seed) * 0.04));

        if (this.y < -10 || this.x < -10 || this.x > width + 10) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249, 232, 162, ${this.opacity})`;
        ctx.shadowColor = "rgba(212, 175, 55, 0.8)";
        ctx.shadowBlur = this.size * 2;
        ctx.fill();
        ctx.restore();
      }
    }

    class EmberSpark {
      constructor() {
        this.reset();
        this.y = height * (0.2 + Math.random() * 0.8);
      }

      reset() {
        this.x = width / 2 + (Math.random() * 70 - 35);
        this.y = height + Math.random() * 20;
        this.vy = -1.1 - Math.random() * 1.4; // Hot buoyant speed
        this.vx = Math.random() * 0.6 - 0.3;
        this.size = 1.0 + Math.random() * 2.0;
        this.life = 0;
        this.maxLife = 90 + Math.random() * 70;
        this.opacity = 0.5 + Math.random() * 0.5;
        this.wobbleSpeed = 0.02 + Math.random() * 0.02;
        this.wobbleAmp = 0.7 + Math.random() * 0.6;
      }

      update() {
        this.y += this.vy;
        this.x += this.vx + Math.sin(this.life * this.wobbleSpeed) * this.wobbleAmp;
        this.life++;

        this.size = Math.max(0.2, this.size - 0.008);

        if (this.life > this.maxLife - 30) {
          this.opacity = Math.max(0, this.opacity - 0.035);
        }

        if (this.life >= this.maxLife || this.y < -10) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(235, 105, 35, ${this.opacity})`;
        ctx.shadowColor = "rgba(235, 65, 20, 0.95)";
        ctx.shadowBlur = this.size * 3.5;
        ctx.fill();
        ctx.restore();
      }
    }

    for (let i = 0; i < maxSmoke; i++) smokeParticles.push(new SmokeParticle());
    for (let i = 0; i < maxGold; i++) goldParticles.push(new GoldParticle());
    for (let i = 0; i < maxEmbers; i++) emberSparks.push(new EmberSpark());

    const render = () => {
      if (!isActive) return;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "screen";

      smokeParticles.forEach((p) => {
        p.update();
        p.draw();
      });

      emberSparks.forEach((e) => {
        e.update();
        e.draw();
      });

      goldParticles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive]);

  return (
    <div className="bakhur-canvas-container">
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

/* INTERACTIVE 3D BOTTLE WITH PARALLAX PEDESTAL AND BACKLIGHT */
function HeroBottle() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setTargetPos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    let frameId;
    const updateParallax = () => {
      setMousePos((prev) => {
        const dx = targetPos.x - prev.x;
        const dy = targetPos.y - prev.y;
        return {
          x: prev.x + dx * 0.05,
          y: prev.y + dy * 0.05
        };
      });
      frameId = requestAnimationFrame(updateParallax);
    };
    updateParallax();
    return () => cancelAnimationFrame(frameId);
  }, [targetPos]);

  return (
    <div className="hero-product reveal" aria-label="Premium attar bottle showcase">
      <BakhurCanvas />
      
      <div 
        className="bottle-glow" 
        style={{
          transform: `translate(${mousePos.x * -28}px, ${mousePos.y * -28}px)`
        }}
      />
      <div className="product-orbit" />
      
      <div 
        className="bottle-scene"
        style={{
          transform: `rotateY(${mousePos.x * 20}deg) rotateX(${-mousePos.y * 16}deg) translateY(${Math.sin(Date.now() / 900) * 8}px)`,
          transformStyle: "preserve-3d"
        }}
      >
        <div className="bottle-cap" />
        <div className="bottle-neck" />
        <div className="bottle-body">
          <i className="bottle-crown" aria-hidden="true" />
          <span className="bottle-logo">MSJ</span>
          <small>Attar</small>
          <strong>Oud<br />Al Haram</strong>
          <em>6ML</em>
        </div>
        
        <div 
          className="hero-pedestal"
          style={{
            transform: `rotateX(25deg) translate(${mousePos.x * 12}px, ${mousePos.y * 8}px)`
          }}
        />
      </div>
    </div>
  );
}

/* TILT PRODUCT CARD COMPONENT */
function ProductCard({ product, onAdd, onView }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 10, y: -y * 10 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <article 
      ref={cardRef}
      className="product-card reveal"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateY(${tilt.x !== 0 ? -6 : 0}px)`,
        transition: tilt.x === 0 ? "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)" : "none"
      }}
    >
      <ProductArt product={product} />
      <div className="product-card-body">
        <p className="eyebrow">{product.type} / {product.size}</p>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="card-bottom">
          <strong>{rupee.format(product.price)}</strong>
          <div>
            <button className="button ghost small-button" type="button" onClick={() => onView(product.id)}>View</button>
            <button className="button primary small-button" type="button" onClick={() => onAdd(product)}>Add</button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [view, setView] = useState("home");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState(defaultProducts);
  const [selectedId, setSelectedId] = useState(defaultProducts[0].id);
  const [filters, setFilters] = useState({ type: "all", size: "all", price: "all" });
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminNote, setAdminNote] = useState("Sign in with the Supabase admin account to unlock listing controls.");
  const [orders, setOrders] = useState([]);
  const [ordersNote, setOrdersNote] = useState("Customer orders appear here after checkout.");
  const [listing, setListing] = useState(emptyListing);
  const [listingNote, setListingNote] = useState("Listings save to Supabase and update your live catalog.");
  const [photoFile, setPhotoFile] = useState(null);
  const [orderNote, setOrderNote] = useState("Orders will be saved to your Supabase dashboard.");
  const [contactNote, setContactNote] = useState("Messages are sent to MSJ Attar email.");
  const [customerSession, setCustomerSession] = useState(null);
  
  // Custom Step-based OTP Flow and Validation States
  const [otpStep, setOtpStep] = useState(1); // 1 = Enter Email, 2 = Enter 6-digit OTP
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [customerNote, setCustomerNote] = useState("Enter your email and verify the OTP sent to your inbox.");
  const [otpError, setOtpError] = useState(false);
  const [orderError, setOrderError] = useState(false);
  const [contactError, setContactError] = useState(false);

  const [customerOrders, setCustomerOrders] = useState([]);
  const [profileNote, setProfileNote] = useState("Login to save and reuse your address at checkout.");
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", city: "", address: "" });
  const [checkout, setCheckout] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    delivery: "Premium gift packing",
    payment: "Cash on delivery"
  });

  // Cursor Trail Tracking State
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });

  const selectedProduct = products.find((product) => product.id === selectedId) || products[0];
  const customerEmail = customerSession?.user?.email && customerSession.user.email !== ADMIN_EMAIL ? customerSession.user.email : "";

  const cartItems = Object.values(cart).map((entry) => ({
    product: products.find((product) => product.id === entry.id) || entry.product,
    quantity: entry.quantity
  }));
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const priceOk =
        filters.price === "all" ||
        (filters.price === "under1500" && product.price < 1500) ||
        (filters.price === "1500to3000" && product.price >= 1500 && product.price <= 3000) ||
        (filters.price === "above3000" && product.price > 3000);
      return (
        (filters.type === "all" || product.type === filters.type) &&
        (filters.size === "all" || product.size === filters.size) &&
        priceOk
      );
    });
  }, [products, filters]);

  const relatedProducts = products.filter((product) => product.type === selectedProduct.type && product.id !== selectedProduct.id).slice(0, 3);

  // Mouse trail tracker
  useEffect(() => {
    const handleCursorMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleCursorMove);
    return () => window.removeEventListener("mousemove", handleCursorMove);
  }, []);

  // Cinematic loader timer logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Intersection Observer for scroll reveal animations
  useEffect(() => {
    if (loading) return;
    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.08 }
    );
    reveals.forEach((el) => observer.observe(el));
    return () => {
      reveals.forEach((el) => observer.unobserve(el));
    };
  }, [view, products, loading]);

  useEffect(() => {
    const syncView = () => {
      const nextView = (window.location.hash || "#home").replace("#", "") || "home";
      setView(nextView === "admin" ? "admin" : nextView);
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    syncView();
    window.addEventListener("hashchange", syncView);
    return () => window.removeEventListener("hashchange", syncView);
  }, []);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      const isAdmin = data.session?.user?.email === ADMIN_EMAIL;
      setAdminUnlocked(Boolean(isAdmin));
      setCustomerSession(isAdmin ? null : data.session);
      await loadProducts();
      if (isAdmin) await loadOrders();
    }
    init();
  }, []);

  useEffect(() => {
    if (customerEmail) {
      setCustomerNote(`Signed in as ${customerEmail}.`);
      setProfile((current) => ({ ...current, email: customerEmail }));
      setCheckout((current) => ({ ...current, email: customerEmail }));
      loadCustomerProfile(customerEmail);
      loadCustomerOrders(customerEmail);
    }
  }, [customerEmail]);

  async function loadProducts() {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (!error && data?.length) {
      const liveProducts = data.map(fromSupabaseProduct);
      setProducts(liveProducts);
      setSelectedId(liveProducts[0].id);
    }
  }

  async function loadOrders() {
    if (!adminUnlocked) return;
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) {
      setOrdersNote(`Order load failed: ${error.message}`);
      return;
    }
    setOrders((data || []).map(fromSupabaseOrder));
    setOrdersNote("Latest customer orders from Supabase.");
  }

  async function loadCustomerOrders(email = customerEmail) {
    if (!email) return;
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_email", email)
      .order("created_at", { ascending: false });
    setCustomerOrders(error ? [] : (data || []).map(fromSupabaseOrder));
  }

  async function loadCustomerProfile(email = customerEmail) {
    if (!email) return;
    const local = JSON.parse(localStorage.getItem(`msj-customer-profile:${email}`) || "null");
    if (local) {
      setProfile(local);
      setCheckout((current) => ({ ...current, ...local, email }));
    }
    const { data, error } = await supabase.from("customer_profiles").select("*").eq("email", email).maybeSingle();
    if (!error && data) {
      const nextProfile = {
        name: data.name || "",
        email,
        phone: data.phone || "",
        city: data.city || "",
        address: data.address || ""
      };
      localStorage.setItem(`msj-customer-profile:${email}`, JSON.stringify(nextProfile));
      setProfile(nextProfile);
      setCheckout((current) => ({ ...current, ...nextProfile, email }));
    }
  }

  async function saveCustomerProfile(nextProfile = profile) {
    if (!customerEmail) {
      setProfileNote("Please login before saving details.");
      return;
    }
    const payload = { ...nextProfile, email: customerEmail };
    localStorage.setItem(`msj-customer-profile:${customerEmail}`, JSON.stringify(payload));
    setProfile(payload);
    setCheckout((current) => ({ ...current, ...payload }));
    const { error } = await supabase.from("customer_profiles").upsert(
      {
        email: customerEmail,
        name: payload.name,
        phone: payload.phone,
        city: payload.city,
        address: payload.address,
        updated_at: new Date().toISOString()
      },
      { onConflict: "email" }
    );
    setProfileNote(error ? "Saved on this device. Supabase profile table is not ready yet." : "Details saved for checkout.");
  }

  function navigate(nextView) {
    window.location.hash = nextView;
    setView(nextView);
    setMenuOpen(false);
  }

  function addToCart(product) {
    setCart((current) => {
      const existing = current[product.id];
      return {
        ...current,
        [product.id]: {
          id: product.id,
          product,
          quantity: existing ? existing.quantity + 1 : 1
        }
      };
    });
  }

  function removeFromCart(productId) {
    setCart((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }

  async function uploadPhoto(productId) {
    if (!photoFile) return listing.image || "";
    const extension = photoFile.name.split(".").pop() || "jpg";
    const path = `${productId}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, photoFile, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function saveListing(event) {
    event.preventDefault();
    if (!adminUnlocked) {
      setListingNote("Please sign in before changing listings.");
      navigate("admin");
      return;
    }
    const id = listing.id || toId(listing.name);
    if (!id || !listing.name || !listing.price) {
      setListingNote("Please add product name and price.");
      return;
    }
    try {
      setListingNote("Saving listing...");
      const image = await uploadPhoto(id);
      const nextProduct = { ...listing, id, price: Number(listing.price), image };
      const { error } = await supabase.from("products").upsert(toSupabaseProduct(nextProduct));
      if (error) throw error;
      setProducts((current) => {
        const withoutOld = current.filter((product) => product.id !== id);
        return [nextProduct, ...withoutOld];
      });
      setListing(emptyListing);
      setPhotoFile(null);
      setListingNote("Listing saved successfully.");
    } catch (error) {
      setListingNote(`Save failed: ${error.message}`);
    }
  }

  async function deleteListing(productId) {
    if (!adminUnlocked) return;
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) {
      setListingNote(`Delete failed: ${error.message}`);
      return;
    }
    setProducts((current) => current.filter((product) => product.id !== productId));
    setListingNote("Listing deleted.");
  }

  async function adminSignIn(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setAdminNote("Signing in...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.get("email"),
      password: formData.get("password")
    });
    if (error) {
      setAdminNote(`Sign in failed: ${error.message}`);
      return;
    }
    if (data.user?.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setAdminUnlocked(false);
      setAdminNote("This email is not allowed for admin controls.");
      return;
    }
    setCustomerSession(null);
    setAdminUnlocked(true);
    setAdminNote("Admin controls unlocked. Changes will save to Supabase.");
    await loadOrders();
  }

  async function adminSignOut() {
    await supabase.auth.signOut();
    setAdminUnlocked(false);
    setOrders([]);
    setAdminNote("Sign in with the Supabase admin account to unlock listing controls.");
  }

  // FIXED CUSTOMER OTP FLOW WITH EMAIL VALIDATION & EXPLICIT 6-DIGIT CODE
  async function sendCustomerOtp() {
    setOtpError(false);
    if (!profile.email) {
      setOtpError(true);
      setCustomerNote("Please enter your email address first.");
      return;
    }
    if (!isValidEmail(profile.email)) {
      setOtpError(true);
      setCustomerNote("Please enter a valid email address.");
      return;
    }
    if (profile.email.trim().toLowerCase() === ADMIN_EMAIL) {
      setOtpError(true);
      setCustomerNote("Admin email is restricted to the Admin panel. Use a different customer email.");
      return;
    }

    setCustomerNote("Sending 6-digit OTP code...");
    setLoadingOtp(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: profile.email.trim(),
      options: { 
        shouldCreateUser: true,
        emailRedirectTo: "https://itsmsjwork-ux.github.io/MSJATTAR/"
      }
    });

    setLoadingOtp(false);

    if (error) {
      setOtpError(true);
      setCustomerNote(`OTP failed: ${error.message}`);
    } else {
      setCustomerNote("6-digit code sent. Please check your inbox and enter the OTP below.");
      setOtpStep(2); // Switch to Verification input step smoothly
    }
  }

  async function verifyCustomerOtp(event) {
    event.preventDefault();
    setOtpError(false);
    const formData = new FormData(event.currentTarget);
    const email = profile.email.trim();
    const token = formData.get("otp")?.trim();

    if (!email || !token) {
      setOtpError(true);
      setCustomerNote("Please enter your email and the 6-digit code.");
      return;
    }

    setCustomerNote("Verifying code...");
    setLoadingOtp(true);

    const { data, error } = await supabase.auth.verifyOtp({ 
      email, 
      token, 
      type: "email" 
    });

    setLoadingOtp(false);

    if (error) {
      setOtpError(true);
      setCustomerNote(`Verification failed: ${error.message}. Please check your code.`);
    } else {
      setAdminUnlocked(false);
      setCustomerSession(data.session);
      setCustomerNote(`Successfully signed in as ${email}.`);
      setOtpStep(1);
    }
  }

  async function customerSignOut() {
    await supabase.auth.signOut();
    setCustomerSession(null);
    setCustomerOrders([]);
    setOtpStep(1);
    setCustomerNote("Enter your email and verify the OTP sent to your inbox.");
  }

  // FIXED CHECKOUT SUBMIT WITH ROBUST EMAIL VALIDATION
  async function submitOrder(event) {
    event.preventDefault();
    setOrderError(false);

    if (!cartCount) {
      setOrderError(true);
      setOrderNote("Please add at least one product to cart before placing an order.");
      return;
    }

    const emailInput = customerEmail || checkout.email.trim();
    if (!isValidEmail(emailInput)) {
      setOrderError(true);
      setOrderNote("Please enter a valid email address");
      return;
    }

    const payload = {
      customer_name: checkout.name.trim(),
      customer_email: emailInput,
      customer_phone: checkout.phone.trim(),
      city: checkout.city.trim(),
      address: checkout.address.trim(),
      delivery_method: checkout.delivery,
      payment_method: checkout.payment,
      items: cartItems.map(({ product, quantity }) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        size: product.size,
        type: product.type
      })),
      total_amount: cartTotal,
      status: "new"
    };

    if (!payload.customer_name || !payload.customer_phone || !payload.address || !payload.city) {
      setOrderError(true);
      setOrderNote("Please fill in your name, phone, city, and full delivery address.");
      return;
    }

    if (customerEmail) await saveCustomerProfile({ ...checkout, email: customerEmail });
    setOrderNote("Placing order...");

    const { error } = await supabase.from("orders").insert(payload);
    if (error) {
      setOrderError(true);
      setOrderNote(`Order failed: ${error.message}`);
      return;
    }

    setCart({});
    setOrderNote("Order placed successfully. We will contact you soon.");
    if (adminUnlocked) await loadOrders();
    if (customerEmail) await loadCustomerOrders();
  }

  async function updateOrderStatus(orderId, status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrdersNote(error ? `Status update failed: ${error.message}` : "Order status updated.");
    if (!error) await loadOrders();
  }

  // FIXED CONTACT WITH ROBUST EMAIL VALIDATION
  async function submitContact(event) {
    event.preventDefault();
    setContactError(false);
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.trim();

    if (!isValidEmail(email)) {
      setContactError(true);
      setContactNote("Please enter a valid email address");
      return;
    }

    setContactNote("Sending message...");
    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData
      });
      if (!response.ok) throw new Error("Email service failed");
      event.currentTarget.reset();
      setContactNote("Message sent successfully.");
    } catch {
      const subject = encodeURIComponent("MSJ Attar contact request");
      const body = encodeURIComponent(
        `Name: ${formData.get("name")}\nEmail: ${formData.get("email")}\n\nMessage:\n${formData.get("message")}`
      );
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      setContactNote("Opening your email app to send the message.");
    }
  }

  function whatsappOrderUrl(order) {
    const lines = [
      "MSJ Attar order update",
      `Name: ${order.customerName}`,
      `Phone: ${order.customerPhone}`,
      `Email: ${order.customerEmail}`,
      `City: ${order.city}`,
      `Address: ${order.address}`,
      `Total: ${rupee.format(order.total)}`,
      `Status: ${order.status}`,
      "Items:",
      ...order.items.map((item) => `- ${item.name} x ${item.quantity}`)
    ];
    return `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  const navLinks = [
    ["featured", "Featured"],
    ["catalog", "Catalog"],
    ["product", "Product"],
    ["about", "About"],
    ["checkout", "Checkout"],
    ["account", "Account"],
    ["contact", "Contact"]
  ];

  return (
    <>
      {/* 9. PREMIUM LOADING SCREEN */}
      <div className={`loader-screen ${!loading ? "fade-out" : ""}`}>
        <div className="loader-content">
          <h2 className="loader-logo">
            MSJ ATTAR
            <small>Mohammed Shahid Joshiddi</small>
          </h2>
          <div className="loader-bar-container">
            <div className="loader-bar" />
          </div>
        </div>
        <BakhurCanvas isActive={loading} />
      </div>

      {/* 4. CURSOR GLOW TRAIL EFFECT */}
      <div 
        className="cursor-glow" 
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`
        }}
      />

      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      {/* 5. PREMIUM NAVBAR */}
      <header className="site-header">
        <button className="brand-mark" type="button" onClick={() => navigate("home")} aria-label="MSJ Attar home">
          <span className="brand-seal">
            <img src={`${ASSET_BASE}/assets/msj-logo.svg`} alt="MSJ Attar logo" />
          </span>
          <span>
            <strong>MSJ Attar</strong>
            <small>Mohammed Shahid Joshiddi</small>
          </span>
        </button>

        <button 
          className="menu-toggle" 
          type="button" 
          aria-label="Open menu" 
          aria-expanded={menuOpen} 
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span style={{ transform: menuOpen ? "rotate(45deg) translate(6px, 6px)" : "none" }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? "rotate(-45deg) translate(6px, -7px)" : "none" }} />
        </button>

        <nav className={`main-nav ${menuOpen ? "open" : ""}`} aria-label="Primary navigation">
          {navLinks.map(([id, label]) => (
            <button key={id} type="button" className={view === id ? "active" : ""} onClick={() => navigate(id)}>
              {label}
            </button>
          ))}
        </nav>

        <button className="cart-pill" type="button" onClick={() => setCartOpen(true)}>
          <span>Cart</span>
          <strong>{cartCount}</strong>
        </button>
      </header>

      <main>
        {/* 2. ULTRA PREMIUM 3D HERO SECTION */}
        <Section id="home" view={view} className="hero">
          <div className="hero-copy reveal">
            <p className="eyebrow">Pure. Luxurious. Timeless.</p>
            <h1>The Essence<br />Of Luxury</h1>
            <p className="hero-text">Discover the finest Arabic attars crafted with precision, passion and traditional distillation methods.</p>
            <div className="hero-actions">
              <button className="button primary" type="button" onClick={() => navigate("catalog")}>Explore Collection</button>
              <button className="button ghost" type="button" onClick={() => navigate("checkout")}>Shop Now</button>
            </div>
          </div>
          <HeroBottle />
        </Section>

        {/* 10. TRUST SECTION */}
        {(view === "home" || view === "featured") && (
          <div className="hero-trust-band reveal">
            <div className="trust-row">
              <div className="trust-item">
                <div className="trust-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div className="trust-copy">
                  <strong>Premium Quality</strong>
                  <span>100% Original Attar</span>
                </div>
              </div>
              <div className="trust-item">
                <div className="trust-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <div className="trust-copy">
                  <strong>Long Lasting</strong>
                  <span>Up to 24 Hours</span>
                </div>
              </div>
              <div className="trust-item">
                <div className="trust-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <div className="trust-copy">
                  <strong>Natural Ingredients</strong>
                  <span>Pure & Safe</span>
                </div>
              </div>
              <div className="trust-item">
                <div className="trust-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </div>
                <div className="trust-copy">
                  <strong>Made With Love</strong>
                  <span>Crafted with Passion</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. PRODUCT CARD REDESIGN */}
        <Section id="featured" view={view}>
          <SectionHeading eyebrow="Best Sellers" title="Our Premium Collection" text="Signature attars with deep projection, refined dry-downs, and presentation worthy of a private fragrance cabinet." />
          <div className="featured-grid">
            {products.filter((product) => product.featured).map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} onView={(id) => { setSelectedId(id); navigate("product"); }} />
            ))}
          </div>
        </Section>

        {/* CATALOG WITH CUSTOM SCROLL OBSERVERS */}
        <Section id="catalog" view={view} className="catalog-shell">
          <SectionHeading eyebrow="Full collection" title="Product Catalog" text="Filter by fragrance family, bottle size, and price to find the right attar for daily wear, gifting, or special occasions." />
          <div className="catalog-layout">
            <aside className="filters glass-panel reveal">
              <h3>Filter Catalog</h3>
              <FilterSelect label="Fragrance Type" value={filters.type} onChange={(type) => setFilters({ ...filters, type })} options={["all", "Oud", "Floral", "Musk", "Spice", "Fresh"]} />
              <FilterSelect label="Bottle Size" value={filters.size} onChange={(size) => setFilters({ ...filters, size })} options={["all", "3ml", "6ml", "12ml"]} />
              <FilterSelect label="Price" value={filters.price} onChange={(price) => setFilters({ ...filters, price })} options={["all", "under1500", "1500to3000", "above3000"]} labels={{ under1500: "Under ₹1,500", "1500to3000": "₹1,500 - ₹3,000", above3000: "Above ₹3,000" }} />
              <button className="button ghost full-width" type="button" onClick={() => setFilters({ type: "all", size: "all", price: "all" })}>Reset Filters</button>
            </aside>
            <div className="catalog-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} onView={(id) => { setSelectedId(id); navigate("product"); }} />
              ))}
            </div>
          </div>
        </Section>

        {/* 10. METRICS SECTION */}
        {(view === "home" || view === "catalog" || view === "featured") && (
          <div className="metrics-band reveal">
            <div className="metrics-row">
              <div className="metric-item">
                <h4>5000+</h4>
                <span>Happy Customers</span>
              </div>
              <div className="metric-item">
                <h4>50+</h4>
                <span>Premium Attars</span>
              </div>
              <div className="metric-item">
                <h4>100%</h4>
                <span>Satisfaction</span>
              </div>
              <div className="metric-item">
                <h4>24H</h4>
                <span>Long Lasting</span>
              </div>
            </div>
          </div>
        )}

        {/* THE ART OF PERFUME SECONDARY PROMO SECTION */}
        {(view === "home" || view === "about") && (
          <Section id="art-of-perfume" view={view}>
            <div className="promo-section reveal">
              <div className="promo-copy">
                <p className="eyebrow">The Art of Perfume</p>
                <h2>Crafted For Connoisseurs</h2>
                <p>Each attar is a masterpiece crafted with the finest ingredients and traditional steam-distillation techniques. We blend decades of heritage with luxurious presentation, yielding pure, alcohol-free fragrance rituals that project absolute elegance.</p>
                <button className="button primary" type="button" onClick={() => navigate("catalog")}>Discover More</button>
              </div>
              <div className="promo-video-scene">
                <div className="play-button" aria-label="Play fragrance story video">
                  <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </div>
          </Section>
        )}

        <Section id="product" view={view}>
          <SectionHeading eyebrow="Selected attar" title={selectedProduct.name} text={selectedProduct.description} />
          <div className="product-detail glass-panel reveal">
            <ProductArt product={selectedProduct} />
            <div className="detail-copy">
              <p className="eyebrow">{selectedProduct.type} / {selectedProduct.size}</p>
              <h2>{selectedProduct.name}</h2>
              <p>{selectedProduct.description}</p>
              <div className="detail-list">
                <div><span>Ingredients</span><strong>{selectedProduct.ingredients}</strong></div>
                <div><span>Bottle Size</span><strong>{selectedProduct.size}</strong></div>
                <div><span>Price</span><strong>{rupee.format(selectedProduct.price)}</strong></div>
              </div>
              <div className="detail-actions">
                <button className="button primary" type="button" onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
                <button className="button ghost" type="button" onClick={() => navigate("checkout")}>Proceed to Checkout</button>
              </div>
            </div>
          </div>
          <h3 className="related-title">Related Products</h3>
          <div className="related-grid">
            {(relatedProducts.length ? relatedProducts : products.slice(0, 3)).map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} onView={(id) => { setSelectedId(id); navigate("product"); }} compact />
            ))}
          </div>
        </Section>

        <Section id="about" view={view} className="split-section">
          <div className="about-copy reveal">
            <p className="eyebrow">About the brand</p>
            <h2>Mohammed Shahid Joshiddi</h2>
            <p>MSJ Attar is built on the idea that fragrance should feel personal, ceremonial, and rooted in heritage. Mohammed Shahid Joshiddi curates alcohol-free attars inspired by traditional oil perfumery and modern luxury presentation.</p>
            <p>Each blend focuses on purity, longevity, and emotional memory, from deep oud profiles to soft musks and floral signatures.</p>
          </div>
          <div className="values-grid reveal">
            <ValueCard title="Heritage" text="Traditional attar craft and regional fragrance memory." />
            <ValueCard title="Purity" text="Oil-based blends with thoughtful ingredient selection." />
            <ValueCard title="Exclusivity" text="Small-batch releases for collectors and connoisseurs." />
          </div>
        </Section>

        {/* 7. FIXED STEP-BASED OTP LOGIN EXPERIENCE */}
        <Section id="account" view={view} className="account-section">
          <SectionHeading eyebrow="My account" title="Login & Orders" text="Customers can sign in with email OTP, save delivery details, and view recent orders." />
          <div className="account-layout">
            
            {/* Step-based OTP Form */}
            <div className="account-card glass-panel reveal">
              <h3>Sign in</h3>
              
              <div className={`form-note ${otpError ? "error-feedback" : ""}`}>
                {customerNote}
              </div>

              {otpStep === 1 ? (
                // Step 1: Request OTP for valid Email address
                <div style={{ display: "grid", gap: "1.2rem" }}>
                  <label>Email 
                    <input 
                      type="email" 
                      value={profile.email} 
                      onChange={(event) => setProfile({ ...profile, email: event.target.value })} 
                      placeholder="you@example.com" 
                      required 
                    />
                  </label>
                  <button 
                    className="button primary full-width" 
                    type="button" 
                    onClick={sendCustomerOtp}
                    disabled={loadingOtp}
                  >
                    {loadingOtp ? "Sending Code..." : "Send OTP"}
                  </button>
                </div>
              ) : (
                // Step 2: Validate 6-digit numeric token
                <form onSubmit={verifyCustomerOtp} style={{ display: "grid", gap: "1.2rem" }}>
                  <label>OTP Code
                    <input 
                      name="otp" 
                      type="text" 
                      inputMode="numeric" 
                      maxLength="6" 
                      placeholder="Enter 6-digit code" 
                      required 
                    />
                  </label>
                  <button 
                    className="button primary full-width" 
                    type="submit"
                    disabled={loadingOtp}
                  >
                    {loadingOtp ? "Verifying..." : "Verify & Login"}
                  </button>
                  <button 
                    className="button ghost small-button full-width" 
                    type="button" 
                    onClick={() => { setOtpStep(1); setCustomerNote("Enter your email and verify the OTP sent to your inbox."); }}
                  >
                    Change Email
                  </button>
                </form>
              )}

              {customerEmail && (
                <button 
                  className="button ghost full-width" 
                  type="button" 
                  onClick={customerSignOut}
                  style={{ marginTop: "1rem" }}
                >
                  Sign Out
                </button>
              )}
            </div>

            <form className="account-card glass-panel reveal" onSubmit={(event) => { event.preventDefault(); saveCustomerProfile(profile); }}>
              <h3>Saved details</h3>
              <p className="form-note">{profileNote}</p>
              <div className="field-row">
                <label>Full Name <input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} placeholder="Your name" /></label>
                <label>Phone <input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="+91 98765 43210" /></label>
              </div>
              <div className="field-row">
                <label>City <input value={profile.city} onChange={(event) => setProfile({ ...profile, city: event.target.value })} placeholder="Your city" /></label>
                <label>Email <input value={customerEmail} readOnly placeholder="Login first" /></label>
              </div>
              <label>Address <input value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} placeholder="Street, city, postal code" /></label>
              <button className="button primary full-width" type="submit">Save Details</button>
            </form>

            <div className="account-card glass-panel reveal">
              <div className="listing-head">
                <h3>My orders</h3>
                <button className="button ghost small-button" type="button" onClick={() => loadCustomerOrders()}>Refresh</button>
              </div>
              <div className="customer-orders-list">
                {!customerEmail ? (
                  <div className="order-card"><strong>Login required</strong><span>Your orders will appear here after email login.</span></div>
                ) : customerOrders.length ? (
                  customerOrders.map((order) => <OrderCard key={order.id} order={order} />)
                ) : (
                  <div className="order-card"><strong>No orders yet</strong><span>Your MSJ Attar orders will appear here.</span></div>
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* 8. CHECKOUT WITH VALIDATION */}
        <Section id="checkout" view={view} className="checkout-section">
          <SectionHeading eyebrow="Premium checkout" title="Checkout Experience" text="A smooth three-step purchase flow for fragrance lovers who already know what they want." />
          <div className="checkout-layout">
            <form className="checkout-form glass-panel reveal" onSubmit={submitOrder}>
              <div className="checkout-steps"><span className="active">1. Details</span><span>2. Delivery</span><span>3. Payment</span></div>
              <div className="checkout-account-note">
                <span>{customerEmail ? `Signed in as ${customerEmail}. Saved details are used at checkout.` : "Guest checkout available. Login from Account to reuse saved details."}</span>
                <button type="button" onClick={() => navigate("account")}>Account</button>
              </div>
              <div className="field-row">
                <label>Full Name <input value={checkout.name} onChange={(event) => setCheckout({ ...checkout, name: event.target.value })} placeholder="Your name" required /></label>
                <label>Email <input value={checkout.email} onChange={(event) => setCheckout({ ...checkout, email: event.target.value })} placeholder="you@example.com" required /></label>
              </div>
              <div className="field-row">
                <label>Phone <input value={checkout.phone} onChange={(event) => setCheckout({ ...checkout, phone: event.target.value })} placeholder="+91 98765 43210" required /></label>
                <label>City <input value={checkout.city} onChange={(event) => setCheckout({ ...checkout, city: event.target.value })} placeholder="Your city" required /></label>
              </div>
              <label>Address <input value={checkout.address} onChange={(event) => setCheckout({ ...checkout, address: event.target.value })} placeholder="Street, city, postal code" required /></label>
              <div className="field-row">
                <label>Delivery <select value={checkout.delivery} onChange={(event) => setCheckout({ ...checkout, delivery: event.target.value })}><option>Premium gift packing</option><option>Standard secured shipping</option></select></label>
                <label>Payment <select value={checkout.payment} onChange={(event) => setCheckout({ ...checkout, payment: event.target.value })}><option>Cash on delivery</option><option>UPI / Card</option></select></label>
              </div>
              <button className="button primary full-width" type="submit">Place Order</button>
              <p className={`form-note ${orderError ? "error-feedback" : ""}`}>{orderNote}</p>
            </form>
            <CartSummary items={cartItems} total={cartTotal} onRemove={removeFromCart} />
          </div>
        </Section>

        {/* 8. CONTACT FORM WITH VALIDATION */}
        <Section id="contact" view={view} className="contact-section">
          <SectionHeading eyebrow="Contact" title="Speak With MSJ Attar" text="For gifting, wholesale, custom selections, and private fragrance consultation." />
          <div className="contact-layout">
            <form className="contact-form glass-panel reveal" onSubmit={submitContact}>
              <label>Name <input name="name" type="text" placeholder="Your name" required /></label>
              <label>Email <input name="email" type="email" placeholder="you@example.com" required /></label>
              <label>Message <textarea name="message" rows="5" placeholder="Tell us what you are looking for" required /></label>
              <button className="button primary" type="submit">Send Message</button>
              <p className={`form-note ${contactError ? "error-feedback" : ""}`}>{contactNote}</p>
            </form>
            <div className="social-links glass-panel reveal">
              <h3>Social Links</h3>
              <a href="https://instagram.com" target="_blank">Instagram</a>
              <a href="https://facebook.com" target="_blank">Facebook</a>
              <a href={`https://wa.me/${OWNER_WHATSAPP}`} target="_blank">WhatsApp</a>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </div>
          </div>
        </Section>

        <Section id="admin" view={view} className="manage-section">
          <SectionHeading eyebrow="Private admin" title="Admin Panel" text="Product listing, order management, and status updates are only for the MSJ Attar owner." />
          <form className={`admin-lock glass-panel ${adminUnlocked ? "admin-hidden" : ""}`} onSubmit={adminSignIn}>
            <h3>Admin Panel Access</h3>
            <label>Admin Email <input name="email" type="email" placeholder={ADMIN_EMAIL} required /></label>
            <label>Password <input name="password" type="password" placeholder="Supabase password" required /></label>
            <button className="button primary" type="submit">Unlock Admin</button>
            <p className="form-note">{adminNote}</p>
          </form>
          <div className={`manage-layout ${!adminUnlocked ? "admin-hidden" : ""}`}>
            <form className="listing-form glass-panel reveal" onSubmit={saveListing}>
              <div className="listing-head"><h3>Product listing</h3><button className="button ghost small-button" type="button" onClick={adminSignOut}>Sign Out</button></div>
              <input type="hidden" value={listing.id} readOnly />
              <label>Product Name <input value={listing.name} onChange={(event) => setListing({ ...listing, name: event.target.value })} placeholder="Baccarat Rough" required /></label>
              <div className="field-row">
                <label>Type <select value={listing.type} onChange={(event) => setListing({ ...listing, type: event.target.value })}>{["Oud", "Floral", "Musk", "Spice", "Fresh"].map((type) => <option key={type}>{type}</option>)}</select></label>
                <label>Size <select value={listing.size} onChange={(event) => setListing({ ...listing, size: event.target.value })}>{["3ml", "6ml", "12ml"].map((size) => <option key={size}>{size}</option>)}</select></label>
              </div>
              <div className="field-row">
                <label>Price <input value={listing.price} onChange={(event) => setListing({ ...listing, price: event.target.value })} type="number" placeholder="599" required /></label>
                <label>Accent Color <input value={listing.color} onChange={(event) => setListing({ ...listing, color: event.target.value })} type="color" /></label>
              </div>
              <label>Description <textarea value={listing.description} onChange={(event) => setListing({ ...listing, description: event.target.value })} rows="4" placeholder="Describe fragrance profile" required /></label>
              <label>Ingredients <input value={listing.ingredients} onChange={(event) => setListing({ ...listing, ingredients: event.target.value })} placeholder="Rose extract, oud oil, amber" required /></label>
              <label>Bottle Photo <input type="file" accept="image/*" onChange={(event) => setPhotoFile(event.target.files?.[0] || null)} /></label>
              <label className="checkbox-row"><input type="checkbox" checked={listing.featured} onChange={(event) => setListing({ ...listing, featured: event.target.checked })} /> Show in featured products</label>
              <div className="form-actions">
                <button className="button primary" type="submit">Save Listing</button>
                <button className="button ghost" type="button" onClick={() => { setListing(emptyListing); setPhotoFile(null); }}>Clear</button>
              </div>
              <p className="form-note">{listingNote}</p>
            </form>

            <div className="listing-list glass-panel reveal">
              <div className="listing-head"><h3>Live Listings</h3><button className="button ghost small-button" type="button" onClick={loadProducts}>Refresh</button></div>
              <div className="listing-items">
                {products.map((product) => (
                  <article className="listing-item" key={product.id}>
                    <strong>{product.name}</strong>
                    <span>{product.type} / {product.size} / {rupee.format(product.price)}</span>
                    <div className="listing-actions">
                      <button className="button ghost small-button" type="button" onClick={() => setListing({ ...product, price: String(product.price) })}>Edit</button>
                      <button className="button ghost small-button" type="button" onClick={() => deleteListing(product.id)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className={`orders-panel glass-panel reveal ${!adminUnlocked ? "admin-hidden" : ""}`}>
            <div className="listing-head"><h3>Recent Orders</h3><button className="button ghost small-button" type="button" onClick={loadOrders}>Refresh</button></div>
            <p className="form-note">{ordersNote}</p>
            <div className="orders-list">
              {orders.length ? orders.map((order) => (
                <OrderCard key={order.id} order={order} admin onStatus={updateOrderStatus} whatsappUrl={whatsappOrderUrl(order)} />
              )) : <div className="order-card"><strong>No orders yet</strong><span>Customer orders will appear here after checkout.</span></div>}
            </div>
          </div>
        </Section>
      </main>

      <div className={`cart-drawer ${cartOpen ? "open" : ""}`} aria-hidden={!cartOpen} onClick={(event) => { if (event.currentTarget === event.target) setCartOpen(false); }}>
        <aside className="cart-panel glass-panel">
          <div className="cart-head"><h3>Your Cart</h3><button className="icon-button" type="button" onClick={() => setCartOpen(false)}>×</button></div>
          <div className="cart-items">
            <CartItems items={cartItems} onRemove={removeFromCart} />
          </div>
          <div className="summary-line"><span>Total</span><strong>{rupee.format(cartTotal)}</strong></div>
          <button className="button primary full-width" type="button" onClick={() => { setCartOpen(false); navigate("checkout"); }}>Checkout</button>
        </aside>
      </div>

      <a className="whatsapp-float" href={`https://wa.me/${OWNER_WHATSAPP}`} target="_blank" rel="noreferrer">WhatsApp</a>
    </>
  );
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="section-heading reveal">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function ValueCard({ title, text }) {
  return (
    <div className="value-card glass-panel">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, labels = {} }) {
  return (
    <div className="filter-group">
      <label>{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{labels[option] || (option === "all" ? "All" : option)}</option>
        ))}
      </select>
    </div>
  );
}

function CartItems({ items, onRemove }) {
  if (!items.length) {
    return <div className="cart-empty"><strong>Your cart is empty</strong><span>Add a signature attar to begin checkout.</span></div>;
  }
  return items.map(({ product, quantity }) => (
    <div className="cart-item" key={product.id}>
      <ProductArt product={product} />
      <div><strong>{product.name}</strong><span>{product.size} x {quantity}</span></div>
      <strong>{rupee.format(product.price * quantity)}</strong>
      <button className="button ghost small-button" type="button" onClick={() => onRemove(product.id)}>Remove</button>
    </div>
  ));
}

function CartSummary({ items, total, onRemove }) {
  return (
    <aside className="cart-summary glass-panel reveal">
      <h3>Order Summary</h3>
      <div>{items.length ? <CartItems items={items} onRemove={onRemove} /> : <div className="cart-empty"><strong>Your cart is empty</strong><span>Add a signature attar to begin checkout.</span></div>}</div>
      <div className="summary-line"><span>Subtotal</span><strong>{rupee.format(total)}</strong></div>
      <div className="summary-line muted"><span>Luxury packing</span><span>Included</span></div>
    </aside>
  );
}

function OrderCard({ order, admin = false, onStatus, whatsappUrl }) {
  return (
    <article className="order-card">
      <div className="listing-head">
        <strong>{order.customerName || new Date(order.createdAt).toLocaleString("en-IN")}</strong>
        <span>{rupee.format(order.total)}</span>
      </div>
      {order.customerPhone && <span>{order.customerPhone} - {order.city || ""}</span>}
      {order.customerEmail && <small>{order.customerEmail} - {new Date(order.createdAt).toLocaleString("en-IN")}</small>}
      <small>{order.address}</small>
      <div className="order-lines">
        {order.items.map((item) => <small key={`${order.id}-${item.id}`}>{item.name} x {item.quantity} - {rupee.format(item.price * item.quantity)}</small>)}
      </div>
      {admin ? (
        <div className="order-actions">
          <label>Status
            <select value={order.status} onChange={(event) => onStatus(order.id, event.target.value)}>
              {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <a className="button ghost small-button" href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
      ) : (
        <span>Status: {order.status}</span>
      )}
    </article>
  );
}
