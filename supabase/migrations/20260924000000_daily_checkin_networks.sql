-- Permit reviewed production check-ins while keeping one check-in per account and UTC day.
begin;

alter table public.daily_check_ins
  drop constraint daily_check_ins_network_check;

alter table public.daily_check_ins
  add constraint daily_check_ins_network_check
  check (network in ('devnet', 'mainnet-beta'));

commit;
