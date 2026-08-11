-- Marco 7 — defesa em profundidade para papéis granulares.
-- Esta migração acompanha o código do marco e deve ser aplicada somente após revisão no ambiente Prismivo.

drop policy if exists clients_member_all on public.clients;
create policy clients_member_select on public.clients for select to authenticated
  using (private.has_org_access(organization_id));
create policy clients_editor_insert on public.clients for insert to authenticated
  with check (private.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy clients_editor_update on public.clients for update to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  with check (private.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy clients_editor_delete on public.clients for delete to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin', 'editor']));

drop policy if exists projects_member_all on public.projects;
create policy projects_member_select on public.projects for select to authenticated
  using (private.has_org_access(organization_id));
create policy projects_editor_insert on public.projects for insert to authenticated
  with check (private.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy projects_editor_update on public.projects for update to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  with check (private.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy projects_editor_delete on public.projects for delete to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin', 'editor']));

drop policy if exists tasks_member_all on public.tasks;
create policy tasks_member_select on public.tasks for select to authenticated
  using (private.has_org_access(organization_id));
create policy tasks_editor_insert on public.tasks for insert to authenticated
  with check (private.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy tasks_editor_update on public.tasks for update to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  with check (private.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy tasks_editor_delete on public.tasks for delete to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin', 'editor']));

drop policy if exists approvals_member_all on public.approvals;
create policy approvals_member_select on public.approvals for select to authenticated
  using (private.has_org_access(organization_id));
create policy approvals_editor_insert on public.approvals for insert to authenticated
  with check (private.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy approvals_editor_update on public.approvals for update to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  with check (private.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy approvals_editor_delete on public.approvals for delete to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin', 'editor']));

drop policy if exists files_member_all on public.files;
create policy files_member_select on public.files for select to authenticated
  using (private.has_org_access(organization_id));
create policy files_editor_insert on public.files for insert to authenticated
  with check (
    uploaded_by_user_id = (select auth.uid())
    and private.has_org_role(organization_id, array['owner', 'admin', 'editor'])
  );
create policy files_editor_update on public.files for update to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  with check (private.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy files_editor_delete on public.files for delete to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin', 'editor']));

drop policy if exists tickets_member_all on public.support_tickets;
create policy tickets_member_select on public.support_tickets for select to authenticated
  using (private.has_org_access(organization_id));
create policy tickets_operator_insert on public.support_tickets for insert to authenticated
  with check (
    requester_user_id = (select auth.uid())
    and private.has_org_role(organization_id, array['owner', 'admin', 'editor', 'support'])
  );
create policy tickets_operator_update on public.support_tickets for update to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin', 'editor', 'support']))
  with check (private.has_org_role(organization_id, array['owner', 'admin', 'editor', 'support']));
create policy tickets_operator_delete on public.support_tickets for delete to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists ticket_messages_member_all on public.ticket_messages;
create policy ticket_messages_member_select on public.ticket_messages for select to authenticated
  using (private.has_org_access(organization_id));
create policy ticket_messages_operator_insert on public.ticket_messages for insert to authenticated
  with check (
    author_user_id = (select auth.uid())
    and private.has_org_role(organization_id, array['owner', 'admin', 'editor', 'support'])
  );
create policy ticket_messages_operator_update on public.ticket_messages for update to authenticated
  using (
    author_user_id = (select auth.uid())
    and private.has_org_role(organization_id, array['owner', 'admin', 'editor', 'support'])
  )
  with check (
    author_user_id = (select auth.uid())
    and private.has_org_role(organization_id, array['owner', 'admin', 'editor', 'support'])
  );
create policy ticket_messages_admin_delete on public.ticket_messages for delete to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists memberships_insert_owner on public.memberships;
drop policy if exists memberships_update_owner on public.memberships;
drop policy if exists memberships_delete_owner on public.memberships;
create policy memberships_insert_initial_owner on public.memberships for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'owner'
    and status = 'active'
    and exists (
      select 1 from public.organizations organization
      where organization.id = memberships.organization_id
        and organization.created_by = (select auth.uid())
    )
  );

drop policy if exists activities_member_insert on public.activities;
create policy activities_operator_insert on public.activities for insert to authenticated
  with check (
    actor_user_id = (select auth.uid())
    and private.has_org_role(organization_id, array['owner', 'admin', 'editor', 'support'])
  );

drop policy if exists notifications_insert_member on public.notifications;
create policy notifications_operator_insert on public.notifications for insert to authenticated
  with check (private.has_org_role(organization_id, array['owner', 'admin', 'editor', 'support']));

revoke update on public.organizations from authenticated;
grant update (name, brand_color, visual_style, updated_at) on public.organizations to authenticated;
