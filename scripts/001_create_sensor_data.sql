-- Create sensor_data table for smart can
create table if not exists sensor_data (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  distance_cm float,
  gas_ppm float,
  led_status text
);

-- Allow public read access (no auth required for this simple demo)
alter table sensor_data enable row level security;

create policy "Allow public read access" on sensor_data
  for select
  using (true);

create policy "Allow public insert access" on sensor_data
  for insert
  with check (true);
