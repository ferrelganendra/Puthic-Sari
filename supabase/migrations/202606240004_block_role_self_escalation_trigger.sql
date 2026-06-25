create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  -- Service role/admin maintenance often has no auth.uid(); do not block it here.
  if current_user_id is null then
    return new;
  end if;

  -- Only guard self-service writes. Admins managing another user's profile are allowed.
  if current_user_id <> new.id then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role is distinct from 'customer' then
      raise exception 'Users cannot assign privileged profile roles to themselves.'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.role is distinct from old.role and old.role is distinct from 'admin' then
      raise exception 'Users cannot change their own profile role.'
        using errcode = '42501';
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_role_self_escalation_trigger on public.profiles;
create trigger prevent_role_self_escalation_trigger
before insert or update on public.profiles
for each row execute function public.prevent_role_self_escalation();
