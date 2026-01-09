-- Create public contracts storage bucket for contract screenshots
insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', true)
on conflict (id) do nothing;

-- Allow public read access to contract images
create policy "Contracts images are publicly accessible"
  on storage.objects
  for select
  using (bucket_id = 'contracts');

-- Allow authenticated users to upload contract images
create policy "Authenticated users can upload contract images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'contracts');

-- Allow admins to fully manage contract images
create policy "Admins can manage contract images"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'contracts' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'contracts' and public.has_role(auth.uid(), 'admin'));
