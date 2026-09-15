-- Public ceremonial ledger: page views, audiences, decrees.
-- Unowned rows (no user_id) — guestbook content is shown on the public site.

create table if not exists page_views (
  id          serial primary key,
  visitor_id  text not null,
  created_at  timestamptz not null default now()
);
create index if not exists page_views_created_at_idx on page_views (created_at);
create index if not exists page_views_visitor_id_idx on page_views (visitor_id);

create table if not exists audiences (
  id          serial primary key,
  name        text not null,
  remark      text not null default '',
  title       text not null,
  serial      text not null,
  created_at  timestamptz not null default now()
);
create index if not exists audiences_created_at_idx on audiences (created_at desc);

create table if not exists decrees (
  id          serial primary key,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists decrees_created_at_idx on decrees (created_at desc);
