.PHONY: encrypt build preview deploy dev

# Encrypt private_contacts from place frontmatter → public/member/contacts.enc.json
# Reads MEMBER_CONTACTS_PASSWORD from the environment or .env
encrypt:
	pnpm encrypt:member-contacts

# Encrypt (optional if password missing), then static Astro build
build:
	pnpm build

preview:
	pnpm preview

deploy: build
	pnpm deploy

dev:
	pnpm dev
