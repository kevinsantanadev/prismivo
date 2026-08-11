-- Hardening complementar: nenhum RPC administrativo pode ser chamado anonimamente.

revoke execute on function public.create_organization_invitation(text, text, text, text, timestamptz) from anon;
revoke execute on function public.accept_organization_invitation(text) from anon;
revoke execute on function public.get_organization_members(text) from anon;
revoke execute on function public.get_organization_invitations(text) from anon;
revoke execute on function public.update_organization_member(text, text, text, text) from anon;
revoke execute on function public.remove_organization_member(text, text) from anon;
revoke execute on function public.revoke_organization_invitation(text, text) from anon;

grant execute on function public.create_organization_invitation(text, text, text, text, timestamptz) to authenticated;
grant execute on function public.accept_organization_invitation(text) to authenticated;
grant execute on function public.get_organization_members(text) to authenticated;
grant execute on function public.get_organization_invitations(text) to authenticated;
grant execute on function public.update_organization_member(text, text, text, text) to authenticated;
grant execute on function public.remove_organization_member(text, text) to authenticated;
grant execute on function public.revoke_organization_invitation(text, text) to authenticated;
