/**
 * REMEDY STORE - E-COMMERCE CORE APPLICATION
 * Modern shopping cart, M-Pesa STK push handling, toast notifications, and client-side state
 */

// Shared Product Catalog (Fallback if API is unavailable or static)
const REMEDY_PRODUCTS = [
  {
    id: "immunity-bundle",
    name: "Immunity & Vitality Trio Bundle",
    category: "Synergistic Bundles",
    badge: "Save KES 300",
    badgeType: "badge-organic",
    price: 2600,
    originalPrice: 2900,
    rating: 5.0,
    reviewsCount: 92,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
    benefits: "Our flagship healing trio: Pure Wild Raw Honey, Organic Moringa Powder, and Stone-Ground Cayenne. Maximizes cellular energy and viral immunity.",
    usage: "Combine 1 tbsp Honey + 1 tsp Moringa + 1/4 tsp Cayenne in warm water with lemon daily.",
    ingredients: "Pure Forest Honey (500g) + Moringa Leaf Powder (250g) + Cayenne Pepper (100g)"
  },
  {
    id: "gut-bundle",
    name: "Gut Healing & Acid Reflux Kit",
    category: "Synergistic Bundles",
    badge: "Save KES 250",
    badgeType: "badge-bestseller",
    price: 1550,
    originalPrice: 1800,
    rating: 4.9,
    reviewsCount: 64,
    image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=600&q=80",
    benefits: "Soothes acid reflux, seals irritated gut lining, and detoxifies the intestinal tract with Slippery Elm, Curcumin, and Coconut Charcoal.",
    usage: "Drink Slippery Elm before meals; take charcoal on empty stomach; enjoy golden turmeric at night.",
    ingredients: "Slippery Elm Powder + Golden Turmeric Curcumin + Steam Activated Charcoal"
  },
  {
    id: "radiance-bundle",
    name: "Hair Growth & Skin Radiance Pack",
    category: "Synergistic Bundles",
    badge: "Save KES 400",
    badgeType: "badge-popular",
    price: 2000,
    originalPrice: 2400,
    rating: 4.9,
    reviewsCount: 78,
    image: "https://images.unsplash.com/photo-1510443310065-27f12440ea29?auto=format&fit=crop&w=600&q=80",
    benefits: "Stimulates thick hair follicle growth, eliminates dandruff, and nourishes skin from inside out with cold-pressed Castor Oil & Omega-3 Chia.",
    usage: "Massage warm castor oil into scalp 2x weekly. Soak chia seeds in daily smoothies.",
    ingredients: "Cold-Pressed Castor Oil (500ml) + Raw Organic Chia Seeds (500g)"
  },
  {
    id: "cayenne-pepper",
    name: "Cayenne Pepper",
    category: "Powders & Spices",
    badge: "Bestseller",
    badgeType: "badge-bestseller",
    price: 200,
    originalPrice: 250,
    rating: 4.9,
    reviewsCount: 38,
    image: "https://ke.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/74/9156623/1.jpg?1408",
    benefits: "Rich in capsaicin which boosts metabolism, reduces inflammation, improves blood circulation, and supports heart health.",
    usage: "Add 1/4 teaspoon to warm water with lemon, smoothies, or daily meals.",
    ingredients: "100% Pure Organic Dried Cayenne Pepper (Capsicum annuum)"
  },
  {
    id: "castor-oil",
    name: "Cold-Pressed Castor Oil",
    category: "Oils & Elixirs",
    badge: "Popular",
    badgeType: "badge-popular",
    price: 800,
    originalPrice: 950,
    rating: 4.8,
    reviewsCount: 52,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSL27kXn1xMEkAvLbVfZVia3XJrmG2zTKyCQQ&s",
    benefits: "Promotes thicker hair and lash growth, deeply moisturizes dry skin, relieves joint stiffness, and eases digestion.",
    usage: "Massage into scalp and hair roots twice weekly, or apply warm oil compress to joints.",
    ingredients: "100% Pure Hexane-Free Cold-Pressed Ricinus Communis Seed Oil"
  },
  {
    id: "raw-honey",
    name: "Pure Wild Raw Honey",
    category: "Raw Superfoods",
    badge: "100% Organic",
    badgeType: "badge-organic",
    price: 1200,
    originalPrice: 1400,
    rating: 5.0,
    reviewsCount: 84,
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80",
    benefits: "Unpasteurized and enzyme-rich. Strengthens the immune system, soothes sore throats, aids wound healing, and provides sustained natural energy.",
    usage: "Take 1-2 tablespoons daily directly, or stir into warm herbal tea or oats.",
    ingredients: "Raw, unfiltered African forest honey with natural propolis & pollen"
  },
  {
    id: "hibiscus-flowers",
    name: "Dried Hibiscus Flowers",
    category: "Herbal Teas",
    badge: "Heart Health",
    badgeType: "badge-bestseller",
    price: 900,
    originalPrice: 1100,
    rating: 4.7,
    reviewsCount: 29,
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
    benefits: "Naturally rich in anthocyanins and Vitamin C. Clinically shown to support healthy blood pressure, liver wellness, and metabolic balance.",
    usage: "Steep 1 tablespoon in hot water for 5-8 minutes. Delicious both hot or chilled as refreshing Zobo tea.",
    ingredients: "Whole dried Hibiscus sabdariffa calyces"
  },
  {
    id: "moringa-powder",
    name: "Organic Moringa Leaf Powder",
    category: "Powders & Spices",
    badge: "Miracle Superfood",
    badgeType: "badge-organic",
    price: 1500,
    originalPrice: 1800,
    rating: 4.9,
    reviewsCount: 67,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80",
    benefits: "Known as the 'Miracle Tree'. Packed with 7x the Vitamin C of oranges and 4x the calcium of milk. Enhances vital energy and cellular renewal.",
    usage: "Mix 1 teaspoon daily into green smoothies, fresh juices, warm porridge, or soups.",
    ingredients: "100% Shade-Dried Moringa Oleifera Leaves, stone-ground"
  },
  {
    id: "slippery-elm",
    name: "Slippery Elm Bark Powder",
    category: "Powders & Spices",
    badge: "Gut Health",
    badgeType: "badge-popular",
    price: 1400,
    originalPrice: 1650,
    rating: 4.8,
    reviewsCount: 31,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
    benefits: "Creates a gentle mucilaginous coating that soothes acid reflux, gastritis, IBS, ulcerative discomfort, and inflamed vocal cords.",
    usage: "Whisk 1 teaspoon in 250ml warm water or plant milk. Drink 20 minutes before meals.",
    ingredients: "Inner bark of Ulmus rubra (Slippery Elm)"
  },
  {
    id: "turmeric-powder",
    name: "Golden Turmeric Curcumin",
    category: "Powders & Spices",
    badge: "Anti-Inflammatory",
    badgeType: "badge-bestseller",
    price: 200,
    originalPrice: 250,
    rating: 4.9,
    reviewsCount: 44,
    image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=600&q=80",
    benefits: "High-potency curcumin fights systemic inflammation, relieves joint ache, sharpens cognitive focus, and aids hepatic detoxification.",
    usage: "Blend into golden milk with coconut oil and a pinch of black pepper for maximum bioavailability.",
    ingredients: "Organic Curcuma longa root powder with 5%+ active curcuminoids"
  },
  {
    id: "activated-charcoal",
    name: "Activated Coconut Charcoal",
    category: "Powders & Spices",
    badge: "Total Detox",
    badgeType: "badge-popular",
    price: 200,
    originalPrice: 260,
    rating: 4.6,
    reviewsCount: 22,
    image: "https://images.unsplash.com/photo-1563178406-4cdc2923acbc?auto=format&fit=crop&w=600&q=80",
    benefits: "Ultra-fine steam-activated micropores capture bodily toxins, eliminate intestinal gas, alleviate bloating, and brighten teeth naturally.",
    usage: "Take 1/2 teaspoon in water on an empty stomach, or mix with clay for a purifying face mask.",
    ingredients: "Food-grade steam-activated coconut shell carbon"
  },
  {
    id: "ashwagandha-root",
    name: "KSM-66 Ashwagandha Powder",
    category: "Powders & Spices",
    badge: "Stress & Sleep",
    badgeType: "badge-bestseller",
    price: 200,
    originalPrice: 250,
    rating: 4.9,
    reviewsCount: 58,
    image: "https://images.unsplash.com/photo-1598449356475-b9f71db7d847?auto=format&fit=crop&w=600&q=80",
    benefits: "Revered adaptogen that balances cortisol, calms chronic stress and nervous tension, enhances deep restorative sleep, and optimizes stamina.",
    usage: "Stir 1/2 teaspoon into warm milk with honey before bedtime, or into morning coffee.",
    ingredients: "Full-spectrum Withania somnifera root extract"
  },
  {
    id: "flax-seeds",
    name: "Golden Flax Seeds",
    category: "Seeds & Superfoods",
    badge: "Omega-3 Rich",
    badgeType: "badge-organic",
    price: 300,
    originalPrice: 380,
    rating: 4.7,
    reviewsCount: 35,
    image: "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=600&q=80",
    benefits: "Abundant in plant-based Omega-3 ALA, dietary fiber, and lignans. Supports heart vitality, hormonal equilibrium, and bowel regularity.",
    usage: "Grind fresh and sprinkle over yogurt, chia bowls, salads, or bake into wholesome breads.",
    ingredients: "100% Raw Unroasted Golden Flax Seeds (Linum usitatissimum)"
  },
  {
    id: "chia-seeds",
    name: "Raw Organic Chia Seeds",
    category: "Seeds & Superfoods",
    badge: "High Fiber",
    badgeType: "badge-bestseller",
    price: 1600,
    originalPrice: 1900,
    rating: 4.8,
    reviewsCount: 47,
    image: "https://images.unsplash.com/photo-1510443310065-27f12440ea29?auto=format&fit=crop&w=600&q=80",
    benefits: "Hydration champions forming a nutrient gel that delivers steady sustained energy, healthy digestion, and essential minerals.",
    usage: "Soak 2 tablespoons in almond milk for 20 mins to create creamy pudding, or mix into fruit smoothies.",
    ingredients: "Organic Black & White Chia Seeds (Salvia hispanica)"
  },
  {
    id: "stinging-nettle",
    name: "Wild Stinging Nettle Leaf",
    category: "Herbal Teas",
    badge: "Mineral Rich",
    badgeType: "badge-organic",
    price: 300,
    originalPrice: 380,
    rating: 4.8,
    reviewsCount: 30,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
    benefits: "Naturally high in iron, silica, and calcium. Relieves seasonal allergies, cleanses the kidneys, and nourishes hair and nails.",
    usage: "Steep 1-2 teaspoons in freshly boiled water for 10 minutes. Drink 1-2 cups daily.",
    ingredients: "Wildcrafted dried Stinging Nettle leaves (Urtica dioica)"
  }
];

// =======================
// CART MANAGEMENT
// =======================
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let activeDiscountPercent = Number(localStorage.getItem('discountPercent')) || 0;

function getCart() {
  return cart;
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadges();
  renderCartDrawer();
}

function addToCart(productName, price, image = null) {
  // Find product if image not provided
  const prod = REMEDY_PRODUCTS.find(p => p.name === productName);
  const prodImg = image || (prod ? prod.image : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=80');

  const existing = cart.find(item => item.name === productName);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      name: productName,
      price: Number(price),
      quantity: 1,
      image: prodImg
    });
  }

  saveCart();
  showToast(`<strong>${productName}</strong> added to cart!`, 'success', 'bi-bag-check-fill');

  // Pulse effect on cart icon
  const badge = document.querySelector('.cart-counter');
  if (badge) {
    badge.classList.add('animate__animated', 'animate__pulse');
    setTimeout(() => badge.classList.remove('animate__animated', 'animate__pulse'), 800);
  }
}

function updateCartQty(index, delta) {
  if (!cart[index]) return;
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
}

function removeFromCart(index) {
  if (!cart[index]) return;
  const removedName = cart[index].name;
  cart.splice(index, 1);
  saveCart();
  showToast(`${removedName} removed from cart`, 'info', 'bi-trash');
}

function clearCart() {
  cart = [];
  localStorage.removeItem('cart');
  localStorage.removeItem('discountPercent');
  activeDiscountPercent = 0;
  saveCart();
}

function getCartTotals() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = Math.round(subtotal * (activeDiscountPercent / 100));
  const discountedSubtotal = subtotal - discountAmount;
  const shipping = subtotal > 0 ? (subtotal >= 2500 ? 0 : 50) : 0;
  const tax = subtotal > 0 ? Math.round(discountedSubtotal * 0.005) : 0;
  const grandTotal = subtotal > 0 ? (discountedSubtotal + shipping + tax) : 0;

  return { subtotal, discountAmount, shipping, tax, grandTotal, isFreeShipping: (subtotal >= 2500) };
}

function applyCouponCode(code) {
  const cleanCode = code.trim().toUpperCase();
  if (cleanCode === 'WELLNESS10') {
    activeDiscountPercent = 10;
    localStorage.setItem('discountPercent', '10');
    showToast('🎉 Coupon applied! You got 10% OFF your entire order.', 'success', 'bi-tag-fill');
    renderCartDrawer();
    return true;
  } else if (cleanCode === 'HEAL20') {
    activeDiscountPercent = 20;
    localStorage.setItem('discountPercent', '20');
    showToast('🎉 VIP Coupon applied! 20% OFF!', 'success', 'bi-stars');
    renderCartDrawer();
    return true;
  } else {
    showToast('Invalid promo code. Try "WELLNESS10"', 'error', 'bi-x-circle');
    return false;
  }
}

function updateCartBadges() {
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-counter').forEach(el => {
    el.textContent = totalQty;
    el.style.display = totalQty > 0 ? 'inline-flex' : 'none';
  });

  const totals = getCartTotals();
  document.querySelectorAll('.cart-nav-total').forEach(el => {
    el.textContent = `KES ${totals.grandTotal.toLocaleString()}`;
  });
}

// Render Global Offcanvas Cart Drawer
function renderCartDrawer() {
  const container = document.getElementById('cartDrawerItems');
  if (!container) return;

  const totals = getCartTotals();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="mb-3">
          <i class="bi bi-cart-x text-muted" style="font-size: 3.5rem;"></i>
        </div>
        <h5 class="text-muted">Your cart is empty</h5>
        <p class="small text-muted mb-4">Discover our botanical remedies and nourish your body naturally.</p>
        <a href="order.html" class="btn btn-primary-remedy btn-sm">Explore Remedies</a>
      </div>
    `;
    const footer = document.getElementById('cartDrawerFooter');
    if (footer) footer.style.display = 'none';
    return;
  }

  const footer = document.getElementById('cartDrawerFooter');
  if (footer) footer.style.display = 'block';

  container.innerHTML = cart.map((item, idx) => `
    <div class="cart-item-card">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-details">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-price">KES ${item.price.toLocaleString()}</div>
        <div class="d-flex align-items-center justify-content-between mt-2">
          <div class="qty-control">
            <button class="qty-btn" onclick="updateCartQty(${idx}, -1)" title="Decrease">-</button>
            <span class="qty-display">${item.quantity}</span>
            <button class="qty-btn" onclick="updateCartQty(${idx}, 1)" title="Increase">+</button>
          </div>
          <button class="btn btn-link text-danger p-0 small" onclick="removeFromCart(${idx})" title="Remove">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Update Drawer Totals
  const subtotalEl = document.getElementById('drawerSubtotal');
  const shippingEl = document.getElementById('drawerShipping');
  const discountRow = document.getElementById('drawerDiscountRow');
  const discountEl = document.getElementById('drawerDiscount');
  const grandTotalEl = document.getElementById('drawerGrandTotal');

  if (subtotalEl) subtotalEl.textContent = `KES ${totals.subtotal.toLocaleString()}`;
  if (shippingEl) shippingEl.textContent = totals.shipping === 0 ? 'FREE' : `KES ${totals.shipping}`;
  
  if (discountRow) {
    if (totals.discountAmount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-KES ${totals.discountAmount.toLocaleString()}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  if (grandTotalEl) grandTotalEl.textContent = `KES ${totals.grandTotal.toLocaleString()}`;
}

// =======================
// TOAST NOTIFICATIONS
// =======================
function showToast(message, type = 'info', icon = 'bi-info-circle') {
  let container = document.querySelector('.remedy-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'remedy-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const typeClass = type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : 'toast-info';
  toast.className = `remedy-toast ${typeClass}`;
  
  toast.innerHTML = `
    <div class="fs-5 ${type === 'success' ? 'text-success' : type === 'error' ? 'text-danger' : 'text-primary'}">
      <i class="bi ${icon}"></i>
    </div>
    <div class="flex-grow-1 small">
      ${message}
    </div>
    <button type="button" class="btn-close btn-sm p-1" style="font-size: 0.7rem;"></button>
  `;

  toast.querySelector('.btn-close').onclick = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 250);
  };

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4500);
}

// =======================
// INITIALIZATION
// =======================
window.addEventListener('DOMContentLoaded', () => {
  updateCartBadges();
  renderCartDrawer();

  // Listen for promo code submit
  const couponBtn = document.getElementById('applyCouponBtn');
  if (couponBtn) {
    couponBtn.addEventListener('click', () => {
      const input = document.getElementById('couponInput');
      if (input && input.value) {
        applyCouponCode(input.value);
      }
    });
  }

  // Inject Floating WhatsApp Support Widget on Storefront pages
  if (!document.getElementById('floatingWhatsAppBtn') && !window.location.pathname.includes('admin')) {
    const waBtn = document.createElement('a');
    waBtn.id = 'floatingWhatsAppBtn';
    waBtn.href = 'https://wa.me/254715224878?text=Hello%20Remedy%20Store%2C%20I%20would%20like%20guidance%20on%20natural%20remedies...';
    waBtn.target = '_blank';
    waBtn.rel = 'noopener noreferrer';
    waBtn.title = 'Chat with an Herbalist on WhatsApp';
    waBtn.innerHTML = '<i class="bi bi-whatsapp fs-5"></i><span class="d-none d-md-inline ms-2">Ask an Herbalist</span>';
    waBtn.style.cssText = 'position: fixed; bottom: 24px; right: 24px; background: #25D366; color: #fff; font-weight: 700; font-size: 0.95rem; padding: 12px 20px; border-radius: 50px; display: inline-flex; align-items: center; box-shadow: 0 8px 24px rgba(37, 211, 102, 0.4); z-index: 1020; text-decoration: none; transition: all 0.25s ease;';
    waBtn.onmouseenter = () => waBtn.style.transform = 'translateY(-3px) scale(1.03)';
    waBtn.onmouseleave = () => waBtn.style.transform = 'translateY(0) scale(1)';
    document.body.appendChild(waBtn);
  }
});
