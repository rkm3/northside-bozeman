# Group organization & coordination

How the Northside Bozeman Business Group talks, keeps track of members, keeps the website up to
date, and makes decisions about the brand.

> **Status: proposal.** Items marked **Decide** still need a call from the group.

---

## 1. Setting up the members' Google Group

One Google Group is the group's mailing list, discussion space, and access list. Members join
once, and that membership also gives them access to the member directory and any shared files.

### Setup (one organizer, once)

1. Go to [groups.google.com](https://groups.google.com) and choose **Create group**.
2. **Name:** Northside Bozeman Business Group. **Email:** something like
   `northside-bozeman@googlegroups.com`. If the group later gets a Google Workspace domain, the
   address can be `members@northsidebozeman.com` instead.
3. Suggested privacy settings:

   | Setting | Value | Why |
   | --- | --- | --- |
   | Who can search for the group | Group members | Keeps it off public search |
   | Who can join | Anyone can ask | An organizer approves each request |
   | Who can view conversations | Group members | Discussions stay inside the group |
   | Who can post | Group members | No outside spam |
   | Who can view members | Group members | Members can see each other; the public can't |

4. Add at least **two owners**, so the group never depends on one person's account.
5. Invite the first members by email, one contact per business to start. More people can be
   added later.

### How it gets used

- **Announcements:** stroll dates, planning meetings, deadlines for stroll posters and maps.
- **Discussion:** reply-all threads in email, or on the Groups web page.
- **Subject-line tags** keep threads easy to scan: `[Stroll]`, `[Website]`, `[Brand]`,
  `[Meeting]`, `[Directory]`.

**Decide:** who the owners/moderators are, and whether staff (not just owners) at member
businesses can join.

---

## 2. Using the group to reach the member directory

The **member directory** is a Google Sheet with contact details for each member business. It is
**private**, and it is a different thing from the public business list on the website.

| | Member directory (Google Sheet) | Website directory (`/map`) |
| --- | --- | --- |
| Who sees it | Group members only | Everyone |
| What's in it | Contact names, emails, phones, roles, stroll participation | Business name, address, public phone, website, description, photo |
| Who edits it | Organizers (members can comment) | Website maintainer, from change requests |

### Sharing the Sheet with the group

1. Create the Sheet in an organizer's Google Drive. Ideally use a shared drive or a group-owned
   account, so it doesn't vanish if one person leaves.
2. Choose **Share**, add the **group's email address**, and give it **Viewer** or **Commenter**
   access.
3. Done. Anyone who joins the group gets access, and anyone removed from the group loses it.
   Nobody needs to manage sharing one person at a time.

Pin a link to the Sheet in the group's welcome message and in the group description.

**Gotcha:** to open the Sheet, a member has to be signed in to Google with the **same email
address that's in the group**. If a member uses a non-Gmail address (like their business
domain), they can create a free Google account using that existing address at
[accounts.google.com/signup](https://accounts.google.com/signup) by choosing "Use my current
email address instead".

### Suggested columns

`Business` · `Website slug` (matches the website file, e.g. `grotto-meats`) · `Primary contact` ·
`Email` · `Phone` · `Role` · `Address` · `Member since` · `Summer Stroll` (Y/N) ·
`Winter Stroll` (Y/N) · `Notes`

The `Website slug` column ties a row to its public listing, so it's easy to tell which members
don't have a website entry yet.

**Decide:** whether members can edit their own rows (Editor access) or only comment.

---

## 3. Requesting changes to your business entry

Every business on the website is one Markdown file plus an optional photo (details in
[Website build](website-build.md#what-a-business-entry-contains)). Members don't need to touch
the files. Send the request and the website maintainer makes the change.

### The easy way: email the group

Post to the Google Group with the subject **`[Website] <Business name>: <what's changing>`**
and include whatever applies:

```text
Business name:
Change type:     New listing / Update / Remove
Address:
Phone (public):
Website or Instagram URL:
Categories:      Food & Drink, Retail, Services, Arts & Culture,
                 Fitness & Wellness, Nonprofit, Other
                 (list your main one first; it sets your map pin color)
Description:     2–4 plain sentences about what you do
Photo or logo:   attached
```

Posting to the group, instead of emailing the maintainer directly, means the request doesn't get
lost if the maintainer changes, and other members can see what's in progress.

### The direct way: a GitHub pull request

Members comfortable with git can edit the files in the
[repository](https://github.com/rkm3/northside-bozeman) and open a pull request:

- Business text: `src/content/places/<slug>.md`
- Photo: `public/images/places/<slug>.webp` (or `.jpg`, `.png`, `.avif`). The filename **must**
  match the slug.
- Stroll posters, maps, and photos: `public/events/<event id>/`, listed under `artifacts` in the
  event file.

The build checks the front matter, so a bad category or missing field shows up before anything
goes live.

### Photo guidelines

- **Real photos** of your storefront, space, or work, in warm natural light. No heavy filters,
  no text burned into the image. See "Imagery" in [`DESIGN.md`](../DESIGN.md).
- **Landscape, at least 1280px wide.** The site crops to 3:2, so keep the subject centered.
- **Logos:** send a **square PNG**. The site shows square PNGs whole instead of cropping them.
- Only send images you have the rights to use. Add a photo credit if you'd like one.

### What happens next

1. The maintainer replies on the thread to say they've seen the request.
2. They make the change, look up map coordinates from the address if needed, and deploy.
3. They reply with the link once it's live.

**Decide:** who maintains the website, and the expected turnaround (for example, within a week,
or sooner when a stroll is coming up). Set a cutoff for stroll-related listing changes, such as
two weeks before each stroll.

---

## 4. Design guidelines & branding discussion

### Where the guidelines live

- [`DESIGN.md`](../DESIGN.md) is the source of truth: logos, colors, typography, layout, imagery,
  map styling, and voice.
- The `/brand` page on the website is the shareable version, with live color swatches and
  contrast checks. Send members and designers there.
- Logo files are in `public/brand/` and are served from `/brand/…` on the site.

### Short version for members

- **The feel:** a historic brewery-and-rail district at the foot of the Bridgers. Warm,
  handmade, a little vintage. Never slick.
- **Logo:** use the files as they are. Don't recolor, stretch, or put the full logo on dark or
  busy photos (use the square icon there). Don't retype "Northside Bozeman" in a font to fake the
  logo.
- **Colors:** Rust Red leads; Ember Orange, Forest Olive, and Golden Ochre are accents, on a Warm
  Off-White background. Mostly paper and ink, with a little accent.
- **Tagline:** *From Lager to Legacy.*
- **Voice:** neighborly, rooted in real local history and names, plainspoken.

### Using the brand on your own materials

Members are welcome to use the badge or icon to show they're part of the Northside, for example
on stroll posters, social posts, and storefront signs. Keep the logo rules above. For anything
printed, ask first: the current logos are web-quality rasters and will look soft in print.

### How brand decisions get made

1. **Propose** on the Google Group with a `[Brand]` subject line. Attach a mockup or link if you
   have one.
2. **Discuss** on the thread for about a week, or bring it to the next meeting.
3. **Decide:** organizers make the call, by consensus or a simple majority of members who
   respond.
4. **Record** the outcome in `DESIGN.md` (and in `src/styles/global.css` / `src/data/brand.ts`
   if colors change), so the site and the guidelines stay in sync.

### Open brand questions

- **Vector logo masters.** Commission an SVG/PDF redraw before any print, signage, or merch.
  Who, and what budget?
- **Stroll identity.** Should each stroll get its own poster look within the brand (for example,
  a seasonal accent color), or keep one consistent template?
- **Name.** "Northside Bozeman," "Northside Neighborhood," and "Historic Brewery District" all
  appear on the site. Pick one primary name and decide when to use the others.
- **Contact email/domain.** A `northsidebozeman.com` address would look more official than a
  `googlegroups.com` one.
