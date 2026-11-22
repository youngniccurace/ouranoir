#!/usr/bin/env python3
"""
Generates the OuraNoir sub-pages (about, services, contact, 404, book redirect)
from one shared header / navbar / footer, and keeps the navbar + footer in
index.html in sync.

The site itself stays plain static HTML - this script is only a helper so the
shared parts don't have to be edited in every file by hand.

    python3 tools/build_pages.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Shared pieces
# ---------------------------------------------------------------------------

def head(title: str, description: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">

    <head>
        <meta charset="utf-8">
        <title>{title}</title>
        <meta content="width=device-width, initial-scale=1.0" name="viewport">
        <meta content="OnlyFans agency, OnlyFans management, creator management, content creator agency, OuraNoir" name="keywords">
        <meta content="{description}" name="description">
        <meta property="og:title" content="{title}">
        <meta property="og:description" content="{description}">
        <meta property="og:type" content="website">

        <!-- Google Web Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&family=Playball&display=swap" rel="stylesheet">

        <!-- Icon Font Stylesheet -->
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.15.4/css/all.css"/>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css" rel="stylesheet">

        <!-- Libraries Stylesheet -->
        <link href="lib/animate/animate.min.css" rel="stylesheet">

        <!-- Customized Bootstrap Stylesheet -->
        <link href="css/bootstrap.min.css" rel="stylesheet">

        <!-- Template Stylesheet -->
        <link href="css/style.css" rel="stylesheet">
    </head>

    <body>

        <!-- Spinner Start -->
        <div id="spinner" class="show w-100 vh-100 bg-white position-fixed translate-middle top-50 start-50  d-flex align-items-center justify-content-center">
            <div class="spinner-grow text-primary" role="status"></div>
        </div>
        <!-- Spinner End -->


"""


NAV_ITEMS = [
    ("home", "index.html", "Home"),
    ("about", "about.html", "About"),
    ("services", "service.html", "Services"),
    ("process", "index.html#process", "How It Works"),
    ("faq", "index.html#faq", "FAQ"),
    ("contact", "contact.html", "Contact"),
]


def navbar(active: str) -> str:
    links = "\n".join(
        f'                            <a href="{href}" class="nav-item nav-link{" active" if key == active else ""}">{label}</a>'
        for key, href, label in NAV_ITEMS
    )
    return f"""        <!-- Navbar start -->
        <div class="container-fluid nav-bar">
            <div class="container">
                <nav class="navbar navbar-light navbar-expand-lg py-4">
                    <a href="index.html" class="navbar-brand">
                        <h1 class="text-primary fw-bold mb-0">Oura<span class="text-dark">Noir</span> </h1>
                    </a>
                    <button class="navbar-toggler py-2 px-3" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse" aria-label="Toggle navigation">
                        <span class="fa fa-bars text-primary"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarCollapse">
                        <div class="navbar-nav mx-auto">
{links}
                        </div>
                        <a href="apply/" class="btn btn-primary py-2 px-4 rounded-pill">Apply Now</a>
                    </div>
                </nav>
            </div>
        </div>
        <!-- Navbar End -->
"""


def page_header(title: str, crumb: str, intro: str = "") -> str:
    intro_html = f'\n                <p class="fs-5 mb-4 mx-auto" style="max-width: 720px;">{intro}</p>' if intro else ""
    return f"""

        <!-- Page Header Start -->
        <div class="container-fluid bg-light py-6 my-6 mt-0">
            <div class="container text-center animated bounceInDown">
                <h1 class="display-1 mb-4">{title}</h1>{intro_html}
                <ol class="breadcrumb justify-content-center mb-0">
                    <li class="breadcrumb-item"><a href="index.html">Home</a></li>
                    <li class="breadcrumb-item text-dark" aria-current="page">{crumb}</li>
                </ol>
            </div>
        </div>
        <!-- Page Header End -->
"""


FOOTER = """        <!-- Footer Start -->
        <div class="container-fluid footer py-6 mb-0 bg-light">
            <div class="container">
                <div class="row g-5">
                    <div class="col-lg-4 col-md-6">
                        <div class="footer-item">
                            <h1 class="text-primary">Oura<span class="text-dark">Noir</span></h1>
                            <p class="lh-lg mb-4">A full-service management agency helping creators grow their brand, their audience and their income &mdash; on their own terms.</p>
                            <!-- TODO: add your real social media links -->
                            <div class="footer-icon d-flex">
                                <a class="btn btn-primary btn-sm-square me-2 rounded-circle" href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                                <a class="btn btn-primary btn-sm-square me-2 rounded-circle" href="#" aria-label="X / Twitter"><i class="fab fa-twitter"></i></a>
                                <a class="btn btn-primary btn-sm-square rounded-circle" href="#" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6">
                        <div class="footer-item">
                            <h4 class="mb-4">Quick Links</h4>
                            <div class="d-flex flex-column align-items-start">
                                <a class="text-body mb-3" href="about.html"><i class="fa fa-angle-right text-primary me-2"></i>About Us</a>
                                <a class="text-body mb-3" href="service.html"><i class="fa fa-angle-right text-primary me-2"></i>Services</a>
                                <a class="text-body mb-3" href="index.html#process"><i class="fa fa-angle-right text-primary me-2"></i>How It Works</a>
                                <a class="text-body mb-3" href="index.html#faq"><i class="fa fa-angle-right text-primary me-2"></i>FAQ</a>
                                <a class="text-body mb-3" href="apply/"><i class="fa fa-angle-right text-primary me-2"></i>Apply Now</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6">
                        <div class="footer-item">
                            <h4 class="mb-4">Contact Us</h4>
                            <!-- TODO: replace with your real contact details -->
                            <div class="d-flex flex-column align-items-start">
                                <p><i class="fas fa-envelope text-primary me-2"></i> info@example.com</p>
                                <p><i class="fa fa-clock text-primary me-2"></i> Fan engagement 24/7</p>
                                <p><i class="fas fa-lock text-primary me-2"></i> All enquiries are confidential</p>
                                <a href="contact.html" class="btn btn-primary py-2 px-4 rounded-pill">Get In Touch</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Footer End -->


        <!-- Copyright Start -->
        <div class="container-fluid copyright bg-dark py-4">
            <div class="container">
                <div class="row">
                    <div class="col-md-6 text-center text-md-start mb-3 mb-md-0">
                        <span class="text-light"><i class="fas fa-copyright text-light me-2"></i>OuraNoir. All rights reserved. 18+ only.</span>
                    </div>
                    <div class="col-md-6 my-auto text-center text-md-end text-white">
                        <!--/*** This template is free as long as you keep the below author’s credit link/attribution link/backlink. ***/-->
                        <!--/*** If you'd like to use the template without the below author’s credit link/attribution link/backlink, ***/-->
                        <!--/*** you can purchase the Credit Removal License from "https://aquikee.co.ke/credit-removal". ***/-->
                        Designed By <a class="border-bottom" href="https://aquikee.co.ke">Aquikee</a> Distributed By <a class="border-bottom" href="https://aquikee.co.ke">Aquikee Web Solutions</a>
                    </div>
                </div>
            </div>
        </div>
        <!-- Copyright End -->
"""


def tail(extra_scripts: str = "") -> str:
    return f"""

        <!-- Back to Top -->
        <a href="#" class="btn btn-md-square btn-primary rounded-circle back-to-top" aria-label="Back to top"><i class="fa fa-arrow-up"></i></a>


        <!-- JavaScript Libraries -->
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js"></script>
        <script src="lib/wow/wow.min.js"></script>
        <script src="lib/easing/easing.min.js"></script>
        <script src="lib/waypoints/waypoints.min.js"></script>
        <script src="lib/counterup/counterup.min.js"></script>
        <script src="lib/owlcarousel/owl.carousel.min.js"></script>

        <!-- Template Javascript -->
        <script src="js/main.js"></script>{extra_scripts}
    </body>
</html>
"""


CTA = """

        <!-- Call To Action Start -->
        <div class="container-fluid cta-noir py-6">
            <div class="container text-center wow bounceInUp" data-wow-delay="0.1s">
                <h1 class="display-4 text-white mb-4">Ready To Take Your Page <span class="text-primary">To The Next Level?</span></h1>
                <p class="fs-5 text-white-50 mb-5">Apply today. It's free, confidential and takes about 5 minutes.</p>
                <a href="apply/" class="btn btn-primary py-3 px-5 rounded-pill fs-5">Apply Now <i class="fas fa-arrow-right ps-2"></i></a>
            </div>
        </div>
        <!-- Call To Action End -->


"""


def badge(text: str, bg: str = "bg-light") -> str:
    return f'<small class="d-inline-block fw-bold text-dark text-uppercase {bg} border border-primary rounded-pill px-4 py-1 mb-3">{text}</small>'


# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------

ABOUT = page_header(
    "About Us", "About",
    "We're a management team that takes care of the business side of being a creator, so you can focus on what you do best.",
) + f"""

        <!-- Story Start -->
        <div class="container-fluid py-6 pt-0">
            <div class="container">
                <div class="row g-5 align-items-center">
                    <div class="col-lg-6 wow bounceInUp" data-wow-delay="0.1s">
                        {badge("Who We Are")}
                        <h1 class="display-5 mb-4">Built Around The Creator, Not The Agency</h1>
                        <p class="mb-4">Running a successful page takes far more than great content. There's planning and scheduling, pricing and promotions, marketing on other platforms, replying to fans at all hours, and keeping your identity and content safe. Doing all of that alone is exhausting.</p>
                        <p class="mb-4">OuraNoir was set up to carry that load. We give every creator a dedicated team and a personal plan, built around their goals, their schedule and their boundaries &mdash; never the other way round.</p>
                        <a href="apply/" class="btn btn-primary py-3 px-5 rounded-pill">Work With Us<i class="fas fa-arrow-right ps-2"></i></a>
                    </div>
                    <div class="col-lg-6 wow bounceInUp" data-wow-delay="0.3s">
                        <div class="noir-card">
                            <div class="noir-monogram">ON</div>
                            <p class="noir-tagline">Our mission</p>
                            <p class="position-relative text-white-50 fs-5 mb-0">To help creators build a page that earns well, grows steadily and stays theirs &mdash; with a team they can trust behind them.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Story End -->


        <!-- Values Start -->
        <div class="container-fluid py-6 bg-light">
            <div class="container">
                <div class="text-center wow bounceInUp" data-wow-delay="0.1s">
                    {badge("Our Values", "bg-white")}
                    <h1 class="display-5 mb-5">What We Stand For</h1>
                </div>
                <div class="row g-4">
                    <div class="col-lg-3 col-md-6 wow bounceInUp" data-wow-delay="0.1s">
                        <div class="step-item text-center">
                            <i class="fas fa-key fa-3x text-primary mb-4"></i>
                            <h4 class="mb-3">Ownership</h4>
                            <p class="mb-0">Your account, your content and your brand always belong to you.</p>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 wow bounceInUp" data-wow-delay="0.3s">
                        <div class="step-item text-center">
                            <i class="fas fa-user-shield fa-3x text-primary mb-4"></i>
                            <h4 class="mb-3">Privacy</h4>
                            <p class="mb-0">Discretion comes first. Your personal details stay private and protected.</p>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 wow bounceInUp" data-wow-delay="0.5s">
                        <div class="step-item text-center">
                            <i class="fas fa-balance-scale fa-3x text-primary mb-4"></i>
                            <h4 class="mb-3">Transparency</h4>
                            <p class="mb-0">Clear terms agreed up front and regular reports, so there are no surprises.</p>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 wow bounceInUp" data-wow-delay="0.7s">
                        <div class="step-item text-center">
                            <i class="fas fa-hand-holding-heart fa-3x text-primary mb-4"></i>
                            <h4 class="mb-3">Respect</h4>
                            <p class="mb-0">You set your boundaries. We never pressure you into content you're not comfortable with.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Values End -->


        <!-- Why Us Start -->
        <div class="container-fluid py-6">
            <div class="container">
                <div class="row g-5 align-items-center">
                    <div class="col-lg-5 wow bounceInUp" data-wow-delay="0.1s">
                        {badge("Why OuraNoir")}
                        <h1 class="display-5 mb-4">What Working With Us Looks Like</h1>
                        <p class="mb-0">From your first call onwards, you'll know exactly who is working on your page, what they're doing and how it's going.</p>
                    </div>
                    <div class="col-lg-7 wow bounceInUp" data-wow-delay="0.3s">
                        <div class="row g-4">
                            <div class="col-sm-6">
                                <div class="d-flex">
                                    <i class="fas fa-user-tie fa-2x text-primary me-3 mt-1"></i>
                                    <div>
                                        <h5 class="mb-2">A dedicated manager</h5>
                                        <p class="mb-0">One main point of contact who knows your page inside out.</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <div class="d-flex">
                                    <i class="fas fa-map-signs fa-2x text-primary me-3 mt-1"></i>
                                    <div>
                                        <h5 class="mb-2">A personal plan</h5>
                                        <p class="mb-0">Strategy built for your niche and your goals, not a copy-paste template.</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <div class="d-flex">
                                    <i class="fas fa-chart-line fa-2x text-primary me-3 mt-1"></i>
                                    <div>
                                        <h5 class="mb-2">Regular reporting</h5>
                                        <p class="mb-0">Clear updates on earnings, growth and what we're trying next.</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <div class="d-flex">
                                    <i class="fas fa-seedling fa-2x text-primary me-3 mt-1"></i>
                                    <div>
                                        <h5 class="mb-2">New &amp; established creators</h5>
                                        <p class="mb-0">Whether you're starting from zero or already earning, we'll meet you where you are.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Why Us End -->
""" + CTA


def service_block(icon: str, title: str, text: str, bullets: list[str], delay: str) -> str:
    items = "\n".join(
        f'                                <li class="mb-2"><i class="fas fa-check text-primary me-2"></i>{b}</li>' for b in bullets
    )
    return f"""                    <div class="col-lg-6 wow bounceInUp" data-wow-delay="{delay}">
                        <div class="service-detail h-100">
                            <div class="d-flex align-items-center mb-4">
                                <div class="service-detail-icon me-4"><i class="fas {icon}"></i></div>
                                <h4 class="mb-0">{title}</h4>
                            </div>
                            <p class="mb-4">{text}</p>
                            <ul class="list-unstyled mb-0">
{items}
                            </ul>
                        </div>
                    </div>"""


SERVICES_LIST = [
    ("fa-user-tie", "Account Management",
     "We take care of the day-to-day running of your page so it's always active and earning.",
     ["Posting schedule and content calendar", "Subscription pricing, bundles and discounts", "Pay-per-view and promotions planning"]),
    ("fa-lightbulb", "Content Strategy",
     "Ideas and plans based on what your audience actually responds to &mdash; always within your limits.",
     ["Content ideas tailored to your niche", "Shoot planning and themes", "Reviewing what performs best"]),
    ("fa-comments", "Fan Engagement",
     "Fans who feel noticed stay subscribed longer. We keep conversations going around the clock.",
     ["24/7 messaging in your voice", "Building loyal, long-term fans", "Welcome and re-engagement messages"]),
    ("fa-hashtag", "Social Media Growth",
     "Most new subscribers find you elsewhere first. We help grow the platforms that feed your page.",
     ["Instagram, TikTok, X and Reddit", "Posting plans and profile optimisation", "Platform-safe promotion"]),
    ("fa-bullhorn", "Promotion &amp; Marketing",
     "Putting your page in front of the right people at the right time.",
     ["Targeted promotional campaigns", "Cross-promotion opportunities", "Seasonal and event-based offers"]),
    ("fa-gem", "Branding",
     "A clear, consistent persona makes your page memorable and easier to market.",
     ["Persona and niche positioning", "Bio, profile and visual style", "Consistent tone across platforms"]),
    ("fa-user-shield", "Privacy &amp; Protection",
     "Your safety and your content's security are taken seriously from day one.",
     ["Leak monitoring and takedown requests", "Guidance on protecting your identity", "Geo-blocking and account security advice"]),
    ("fa-chart-pie", "Analytics &amp; Reporting",
     "Know exactly where you stand and what's driving your results.",
     ["Regular performance reports", "Earnings and subscriber trends", "Clear next steps every month"]),
]

SERVICES = page_header(
    "Our Services", "Services",
    "Everything it takes to run and grow a successful page, handled by one dedicated team.",
) + """

        <!-- Services Detail Start -->
        <div class="container-fluid py-6 pt-0">
            <div class="container">
                <div class="row g-4">
""" + "\n".join(
    service_block(icon, title, text, bullets, f"0.{1 + (i % 2) * 2}s")
    for i, (icon, title, text, bullets) in enumerate(SERVICES_LIST)
) + f"""
                </div>
            </div>
        </div>
        <!-- Services Detail End -->


        <!-- Requirements Start -->
        <div class="container-fluid py-6 bg-light">
            <div class="container">
                <div class="row g-5 align-items-center">
                    <div class="col-lg-6 wow bounceInUp" data-wow-delay="0.1s">
                        {badge("Who Can Apply", "bg-white")}
                        <h1 class="display-5 mb-4">Is OuraNoir Right For You?</h1>
                        <p class="mb-4">We work with creators at every stage. If you're serious about growing your page and want a team behind you, we'd love to hear from you.</p>
                        <a href="apply/" class="btn btn-primary py-3 px-5 rounded-pill">Apply Now<i class="fas fa-arrow-right ps-2"></i></a>
                    </div>
                    <div class="col-lg-6 wow bounceInUp" data-wow-delay="0.3s">
                        <div class="bg-white rounded p-5 shadow-sm">
                            <h4 class="mb-4">You'll need:</h4>
                            <ul class="list-unstyled mb-0">
                                <li class="mb-3"><i class="fas fa-check-circle text-primary me-2"></i>To be at least 18 years old</li>
                                <li class="mb-3"><i class="fas fa-check-circle text-primary me-2"></i>A valid government-issued photo ID</li>
                                <li class="mb-3"><i class="fas fa-check-circle text-primary me-2"></i>A few recent photos for your application</li>
                                <li class="mb-0"><i class="fas fa-check-circle text-primary me-2"></i>Commitment to creating content regularly</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Requirements End -->
""" + CTA


CONTACT = page_header(
    "Contact Us", "Contact",
    "Questions about working with us? Send us a message and we'll get back to you.",
) + f"""

        <!-- Contact Start -->
        <div class="container-fluid py-6 pt-0">
            <div class="container">
                <div class="row g-5">
                    <div class="col-lg-7 wow bounceInUp" data-wow-delay="0.1s">
                        <div class="p-5 bg-light rounded contact-form">
                            {badge("Get In Touch", "bg-white")}
                            <h1 class="display-5 mb-4">Send Us A Message</h1>
                            <p class="mb-4">Want to join as a creator? The quickest way is our <a href="apply/" class="fw-bold">application form</a>. For anything else, use the form below.</p>
                            <form id="contactForm" action="contact.php" method="post" novalidate>
                                <!-- Honeypot field: hidden from people, catches spam bots -->
                                <div class="d-none" aria-hidden="true">
                                    <label for="website">Leave this field empty</label>
                                    <input type="text" id="website" name="website" tabindex="-1" autocomplete="off">
                                </div>
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <label for="name" class="form-label text-dark">Your Name</label>
                                        <input type="text" id="name" name="name" class="form-control p-3 border-primary bg-white" placeholder="Your name" maxlength="100" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="email" class="form-label text-dark">Your Email</label>
                                        <input type="email" id="email" name="email" class="form-control p-3 border-primary bg-white" placeholder="you@example.com" maxlength="254" required>
                                    </div>
                                    <div class="col-12">
                                        <label for="subject" class="form-label text-dark">Subject</label>
                                        <select id="subject" name="subject" class="form-select p-3 border-primary bg-white">
                                            <option>General question</option>
                                            <option>Joining as a creator</option>
                                            <option>I'm already a creator with OuraNoir</option>
                                            <option>Business / partnership enquiry</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div class="col-12">
                                        <label for="message" class="form-label text-dark">Message</label>
                                        <textarea id="message" name="message" class="form-control p-3 border-primary bg-white" rows="5" placeholder="How can we help?" maxlength="5000" required></textarea>
                                    </div>
                                    <div class="col-12">
                                        <div id="contactStatus" class="alert d-none mb-0" role="status"></div>
                                    </div>
                                    <div class="col-12">
                                        <button class="w-100 btn btn-primary p-3 rounded-pill" type="submit">Send Message</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div class="col-lg-5 wow bounceInUp" data-wow-delay="0.3s">
                        <div class="d-flex flex-column gap-4 h-100">
                            <div class="contact-card">
                                <i class="fas fa-envelope"></i>
                                <div>
                                    <h5 class="mb-1">Email</h5>
                                    <!-- TODO: replace with your real email -->
                                    <p class="mb-0">info@example.com</p>
                                </div>
                            </div>
                            <div class="contact-card">
                                <i class="fas fa-clock"></i>
                                <div>
                                    <h5 class="mb-1">Response Time</h5>
                                    <p class="mb-0">We aim to reply within 2&ndash;3 business days.</p>
                                </div>
                            </div>
                            <div class="contact-card">
                                <i class="fas fa-lock"></i>
                                <div>
                                    <h5 class="mb-1">Confidential</h5>
                                    <p class="mb-0">Everything you send us is kept private.</p>
                                </div>
                            </div>
                            <div class="noir-card flex-grow-1">
                                <p class="noir-tagline mb-3">Ready to join?</p>
                                <p class="position-relative text-white-50 mb-4">Skip the back-and-forth and send us your application directly. It takes about 5 minutes.</p>
                                <a href="apply/" class="btn btn-primary py-3 px-5 rounded-pill position-relative">Apply Now<i class="fas fa-arrow-right ps-2"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Contact End -->


"""

NOT_FOUND = """

        <!-- 404 Start -->
        <div class="container-fluid py-6 my-6 mt-0 bg-light">
            <div class="container text-center animated bounceInDown">
                <div class="row justify-content-center">
                    <div class="col-lg-6">
                        <i class="bi bi-exclamation-triangle display-1 text-primary"></i>
                        <h1 class="display-1">404</h1>
                        <h1 class="mb-4">Page Not Found</h1>
                        <p class="mb-4">Sorry, the page you're looking for doesn't exist or has moved.</p>
                        <a class="btn btn-primary rounded-pill py-3 px-5 me-2 mb-2" href="index.html">Go To Homepage</a>
                        <a class="btn btn-outline-dark rounded-pill py-3 px-5 mb-2" href="apply/">Apply Now</a>
                    </div>
                </div>
            </div>
        </div>
        <!-- 404 End -->


"""

BOOK_REDIRECT = """<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Apply - OuraNoir</title>
        <meta name="robots" content="noindex">
        <meta http-equiv="refresh" content="0; url=apply/">
        <link rel="canonical" href="apply/">
    </head>
    <body>
        <p>Bookings are now handled through our application form. <a href="apply/">Continue to the application</a>.</p>
    </body>
</html>
"""

PAGES = {
    "about.html": ("About Us - OuraNoir", "Learn about OuraNoir, a creator-first OnlyFans management agency built on ownership, privacy and transparency.", "about", ABOUT, ""),
    "service.html": ("Services - OuraNoir", "Account management, content strategy, fan engagement, social growth, promotion, branding, privacy protection and reporting for creators.", "services", SERVICES, ""),
    "contact.html": ("Contact - OuraNoir", "Get in touch with the OuraNoir team. All enquiries are confidential.", "contact", CONTACT, '\n        <script src="js/contact.js"></script>'),
    "404.html": ("Page Not Found - OuraNoir", "The page you are looking for could not be found.", "", NOT_FOUND, ""),
}


def main() -> None:
    for filename, (title, description, active, body, scripts) in PAGES.items():
        html = head(title, description) + navbar(active) + body + FOOTER + tail(scripts)
        (ROOT / filename).write_text(html, encoding="utf-8")
        print("wrote", filename)

    (ROOT / "book.html").write_text(BOOK_REDIRECT, encoding="utf-8")
    print("wrote book.html (redirect to apply/)")

    # Keep the navbar and footer in index.html identical to the other pages
    index = ROOT / "index.html"
    html = index.read_text(encoding="utf-8")
    html = re.sub(r"        <!-- Navbar start -->.*?<!-- Navbar End -->\n", lambda _: navbar("home"), html, flags=re.S)
    html = re.sub(r"        <!-- Footer Start -->.*?<!-- Copyright End -->\n", lambda _: FOOTER, html, flags=re.S)
    index.write_text(html, encoding="utf-8")
    print("synced navbar + footer in index.html")


if __name__ == "__main__":
    main()
