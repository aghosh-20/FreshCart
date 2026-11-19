import json, re, struct, zlib, threading, http.server, socketserver, os, sys
from playwright.sync_api import sync_playwright

os.environ["PLAYWRIGHT_BROWSERS_PATH"] = "/opt/pw-browsers"
DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "dist")

# ---- test fixture (NOT shipped in the app): shaped like fakestoreapi responses ----
def P(i, t, price, cat, rate, cnt):
    return dict(id=i, title=t, price=price, description=f"Description for {t}. " * 3,
                category=cat, image=f"https://fakestoreapi.com/img/t{i}.png", rating=dict(rate=rate, count=cnt))
PRODUCTS = [
    P(1, "Fixture Backpack", 109.95, "men's clothing", 3.9, 120),
    P(2, "Fixture Slim Shirt", 22.3, "men's clothing", 4.1, 259),
    P(3, "Fixture Gold Ring", 695, "jewelery", 4.6, 400),
    P(4, "Fixture Silver Chain", 168, "jewelery", 3.9, 70),
    P(5, "Fixture SSD Drive", 64, "electronics", 4.8, 200),
    P(6, "Fixture Monitor", 999.99, "electronics", 2.9, 250),
    P(7, "Fixture Rain Jacket", 39.99, "women's clothing", 3.8, 679),
    P(8, "Fixture Casual Top", 7.95, "women's clothing", 4.7, 130),
]
CATS = ["electronics", "jewelery", "men's clothing", "women's clothing"]

def png(w=8, h=8, rgb=(200, 220, 205)):
    raw = b"".join(b"\x00" + bytes(rgb) * w for _ in range(h))
    def chunk(t, d): c = struct.pack(">I", len(d)) + t + d; return c + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")
PNG = png()

calls = []
state = {"fail": False}
CORS = {"access-control-allow-origin": "*"}

def api(route):
    url = route.request.url
    path = url.split("fakestoreapi.com", 1)[1]
    if path.startswith("/img/"):
        return route.fulfill(status=200, body=PNG, headers={**CORS, "content-type": "image/png"})
    calls.append(path)
    if state["fail"]:
        return route.abort("failed")
    base, _, qs = path.partition("?")
    data = None
    if base == "/products": data = list(PRODUCTS)
    elif base == "/products/categories": data = CATS
    elif base.startswith("/products/category/"):
        from urllib.parse import unquote
        data = [p for p in PRODUCTS if p["category"] == unquote(base.split("/products/category/")[1])]
    elif re.fullmatch(r"/products/\d+", base):
        data = next((p for p in PRODUCTS if p["id"] == int(base.rsplit("/", 1)[1])), None)
    if data is None: return route.fulfill(status=404, body="null", headers=CORS)
    if "sort=desc" in qs and isinstance(data, list): data = list(reversed(data))
    m = re.search(r"limit=(\d+)", qs)
    if m and isinstance(data, list): data = data[: int(m.group(1))]
    route.fulfill(status=200, body=json.dumps(data), headers={**CORS, "content-type": "application/json"})

# ---- static server ----
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=DIST, **k)
    def log_message(self, *a): pass
srv = socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.TCPServer(("127.0.0.1", 8123), H); threading.Thread(target=srv.serve_forever, daemon=True).start()

results = []
def check(name, cond, extra=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + (f"  [{extra}]" if extra and not cond else ""))

with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.route("**/fakestoreapi.com/**", api)
    page.goto("http://127.0.0.1:8123/")
    page.get_by_text("Recommended").first.wait_for(timeout=20000)
    page.wait_for_timeout(800)
    page.screenshot(path="01_home.png")

    check("home: branding visible", page.get_by_text("FreshCart").first.is_visible())
    check("home: categories from API", all(page.get_by_text(t).first.is_visible() for t in ["Electronics", "Jewelery", "Men's Clothing", "Women's Clothing"]))
    check("home: banner copy derived from API counts", page.get_by_text("8 products across 4 categories").is_visible())
    check("home: limit=10 and category requests made", any("limit=10" in c for c in calls) and "/products/categories" in calls, str(calls))
    check("home: delivery location control present", page.get_by_text("Set delivery location").is_visible())

    # add to cart from home card (twice -> same line)
    add_btns = page.get_by_role("button", name="Add to cart")
    add_btns.first.click(); page.wait_for_timeout(1700)
    add_btns.first.click(); page.wait_for_timeout(300)
    # tabs
    def tab(name): page.get_by_role("tab", name=re.compile(name)).click(); page.wait_for_timeout(500)
    check("tab badge shows 2", page.get_by_role("tab", name=re.compile("Cart")).inner_text().strip().endswith("2") or "2" in page.get_by_role("tab", name=re.compile("Cart")).inner_text())
    tab("Cart"); page.screenshot(path="02_cart.png")
    check("cart: one line item for repeated add", page.get_by_role("button", name=re.compile(r"^Remove .* from cart")).count() == 1)
    check("cart: line total = 2 x 109.95", page.get_by_text("$219.90").first.is_visible())
    check("cart: item count + subtotal + total", page.get_by_text("Subtotal").is_visible() and page.get_by_text("Total", exact=True).is_visible() and page.get_by_text("$219.90").count() >= 3)
    dec = page.get_by_role("button", name="Decrease quantity").first
    dec.click(); page.wait_for_timeout(200); dec.click(force=True); page.wait_for_timeout(200)
    check("cart: decrease stops at 1", page.get_by_text("$109.95").count() >= 2 and dec.is_disabled())
    page.get_by_role("button", name="Increase quantity").first.click(); page.wait_for_timeout(200)
    check("cart: increase works, totals update", page.get_by_text("$219.90").count() >= 3)

    # shop: search, filter, sort
    tab("Shop"); page.get_by_text("8 products", exact=True).wait_for(); page.screenshot(path="03_shop.png")
    box = page.locator('input[aria-label="Search products"]:not([aria-hidden="true"] *)')
    box.fill("gold"); page.wait_for_timeout(400)
    check("shop: search returns relevant item only", page.get_by_text("1 product", exact=True).is_visible() and page.get_by_text("Fixture Gold Ring").first.is_visible())
    box.fill("zzz"); page.wait_for_timeout(400)
    check("shop: empty state for no match", page.get_by_text("No products found").is_visible())
    page.screenshot(path="04_empty.png")
    page.get_by_role("button", name="Clear filters").click(); page.wait_for_timeout(500)
    page.get_by_role("button", name="Jewelery", exact=True).click(); page.wait_for_timeout(600)
    check("shop: category filter uses API endpoint", any(c.startswith("/products/category/jewelery") for c in calls), str(calls))
    check("shop: category filter result", page.get_by_text("2 products", exact=True).is_visible())
    page.get_by_role("button", name="All", exact=True).click(); page.wait_for_timeout(500)
    n_before = len(calls)
    page.get_by_role("button", name="Price: low to high").click(); page.wait_for_timeout(500)
    titles = page.locator('[aria-label^="Fixture"]').evaluate_all("els => els.filter(e => !e.closest('[aria-hidden=true]') && e.getAttribute('role')==='button').map(e => e.getAttribute('aria-label'))")
    check("shop: price asc order", titles[:3] == ["Fixture Casual Top", "Fixture Slim Shirt", "Fixture Rain Jacket"], str(titles[:3]))
    check("shop: local sort makes no new request", len(calls) == n_before)
    page.get_by_role("button", name="Newest first").click(); page.wait_for_timeout(600)
    check("shop: newest uses ?sort=desc", any("sort=desc" in c for c in calls))
    page.get_by_role("button", name="Top rated").click(); page.wait_for_timeout(500)
    titles = page.locator('[aria-label^="Fixture"]').evaluate_all("els => els.filter(e => !e.closest('[aria-hidden=true]') && e.getAttribute('role')==='button').map(e => e.getAttribute('aria-label'))")
    check("shop: rating order", titles[:2] == ["Fixture SSD Drive", "Fixture Casual Top"], str(titles[:2]))

    # details
    page.get_by_role("button", name="Fixture Slim Shirt").first.click(); page.wait_for_timeout(800)
    page.screenshot(path="05_details.png")
    check("details: full description + rating + review count", page.get_by_text("Description for Fixture Slim Shirt").is_visible() and page.get_by_text("4.1 from 259 reviews").is_visible())
    check("details: GET /products/2 called", "/products/2" in calls)
    inc = page.get_by_role("button", name="Increase quantity")
    inc.click(); inc.click(); page.wait_for_timeout(200)
    check("details: quantity selector + live total", page.get_by_role("button", name=re.compile(r"Add to cart, \$66\.90")).is_visible())
    page.get_by_role("button", name=re.compile("Add to cart")).click(); page.wait_for_timeout(300)
    page.get_by_role("button", name="Add to wishlist").click(); page.wait_for_timeout(300)
    page.get_by_role("button", name="Go back").click(); page.wait_for_timeout(500)
    tab("Cart")
    check("cart: second product added with qty 3, total correct", page.get_by_text("$286.80").count() >= 2, "219.90 + 66.90 = 286.80")
    page.screenshot(path="06_cart2.png")
    tab("Wishlist"); page.screenshot(path="07_wishlist.png")
    check("wishlist: saved product listed", page.get_by_text("Fixture Slim Shirt").first.is_visible())

    # persistence: reload (app restart)
    page.reload(); page.get_by_text("Recommended").first.wait_for(timeout=20000)
    tab("Cart")
    check("restart: cart persisted", page.get_by_text("$286.80").count() >= 2)
    tab("Wishlist")
    check("restart: wishlist persisted", page.get_by_text("Fixture Slim Shirt").first.is_visible())
    page.get_by_role("button", name=re.compile(r"^Remove .* from wishlist")).click(); page.wait_for_timeout(300)
    check("wishlist: remove -> empty state", page.get_by_text("No saved products").is_visible())
    page.screenshot(path="08_wishlist_empty.png")
    tab("Cart")
    page.get_by_role("button", name=re.compile(r"^Remove Fixture Backpack")).click(); page.wait_for_timeout(300)
    check("cart: removing updates totals immediately", page.get_by_text("$66.90").count() >= 3)
    page.on("dialog", lambda d: d.accept())
    page.get_by_text("Clear cart").click(); page.wait_for_timeout(300)
    check("cart: clear -> empty state", page.get_by_text("Your cart is empty").is_visible())
    page.screenshot(path="09_cart_empty.png")

    # error + retry (fresh context so the in-memory request cache is empty)
    page2 = ctx.new_page(); page2.route("**/fakestoreapi.com/**", api)
    state["fail"] = True
    page2.goto("http://127.0.0.1:8123/")
    page2.get_by_role("tab", name=re.compile("Shop")).wait_for(timeout=20000)
    page2.get_by_role("tab", name=re.compile("Shop")).click()
    page2.get_by_text("Could not load products").first.wait_for(timeout=25000)
    page2.screenshot(path="10_error.png")
    check("error state shown when API unreachable", page2.get_by_text("Could not reach the server").first.is_visible())
    state["fail"] = False
    page2.get_by_role("button", name="Try again").first.click(); page2.wait_for_timeout(1200)
    check("retry recovers", page2.get_by_text("8 products", exact=True).is_visible())

    # broken image fallback
    page3 = ctx.new_page()
    def api_broken(route):
        if "/img/" in route.request.url: return route.fulfill(status=404, body="")
        return api(route)
    page3.route("**/fakestoreapi.com/**", api_broken)
    page3.goto("http://127.0.0.1:8123/"); page3.get_by_text("Recommended").first.wait_for(timeout=20000); page3.wait_for_timeout(800)
    page3.screenshot(path="11_broken_images.png")
    check("broken images render fallback without crashing", page3.get_by_text("Fixture Backpack").first.is_visible())
    b.close()

crit = [e for e in errors if "favicon" not in e.lower()]
print("\nconsole errors:", crit[:6])
print(f"\n{sum(ok for _, ok in results)}/{len(results)} checks passed")
