-- Create admin talent dashboard view to fix complex join typing issues
create or replace view public.admin_talent_dashboard as
select
  a.id                 as application_id,
  a.talent_id,
  a.status             as application_status,
  a.created_at         as application_created_at,
  g.id                 as gig_id,
  g.title              as gig_title,
  g.status             as gig_status,
  g.location           as gig_location,
  p.display_name       as talent_display_name,
  p.avatar_url         as talent_avatar_url,
  cp.company_name      as client_company_name
from public.applications a
join public.gigs g      on g.id = a.gig_id
join public.profiles p  on p.id = a.talent_id
left join public.client_profiles cp on cp.user_id = g.client_id;

-- Create admin bookings dashboard view
create or replace view public.admin_bookings_dashboard as
select
  b.id                 as booking_id,
  b.date               as booking_date,
  b.compensation       as booking_compensation,
  g.id                 as gig_id,
  g.title              as gig_title,
  g.status             as gig_status,
  g.location           as gig_location,
  p.display_name       as talent_display_name,
  p.avatar_url         as talent_avatar_url,
  cp.company_name      as client_company_name
from public.bookings b
join public.gigs g      on g.id = b.gig_id
join public.profiles p  on p.id = b.talent_id
left join public.client_profiles cp on cp.user_id = g.client_id;

grant select on public.admin_talent_dashboard to anon, authenticated;
grant select on public.admin_bookings_dashboard to anon, authenticated;
