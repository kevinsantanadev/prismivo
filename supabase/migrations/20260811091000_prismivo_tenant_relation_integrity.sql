-- Defesa em profundidade: toda relação nova deve permanecer dentro da mesma organização.

drop policy if exists deliverables_editor_insert on public.deliverables;
create policy deliverables_editor_insert on public.deliverables for insert to authenticated
  with check (
    created_by_user_id = (select auth.uid())
    and private.has_org_role(organization_id, array['owner', 'admin', 'editor'])
    and exists (
      select 1 from public.projects project
      where project.id = deliverables.project_id
        and project.organization_id = deliverables.organization_id
    )
  );

drop policy if exists deliverable_versions_editor_insert on public.deliverable_versions;
create policy deliverable_versions_editor_insert on public.deliverable_versions for insert to authenticated
  with check (
    created_by_user_id = (select auth.uid())
    and private.has_org_role(organization_id, array['owner', 'admin', 'editor'])
    and exists (
      select 1
      from public.deliverables deliverable
      join public.files stored_file on stored_file.id = deliverable_versions.file_id
      where deliverable.id = deliverable_versions.deliverable_id
        and deliverable.organization_id = deliverable_versions.organization_id
        and stored_file.organization_id = deliverable_versions.organization_id
        and stored_file.project_id = deliverable.project_id
        and stored_file.status = 'available'
    )
  );

drop policy if exists deliverable_comments_member_insert on public.deliverable_comments;
create policy deliverable_comments_member_insert on public.deliverable_comments for insert to authenticated
  with check (
    author_user_id = (select auth.uid())
    and private.has_org_access(organization_id)
    and exists (
      select 1 from public.deliverables deliverable
      where deliverable.id = deliverable_comments.deliverable_id
        and deliverable.organization_id = deliverable_comments.organization_id
    )
    and (
      version_id is null
      or exists (
        select 1 from public.deliverable_versions version
        where version.id = deliverable_comments.version_id
          and version.deliverable_id = deliverable_comments.deliverable_id
          and version.organization_id = deliverable_comments.organization_id
      )
    )
  );

drop policy if exists ticket_attachments_operator_insert on public.ticket_attachments;
create policy ticket_attachments_operator_insert on public.ticket_attachments for insert to authenticated
  with check (
    uploaded_by_user_id = (select auth.uid())
    and private.has_org_role(organization_id, array['owner', 'admin', 'editor', 'support'])
    and exists (
      select 1 from public.support_tickets ticket
      where ticket.id = ticket_attachments.ticket_id
        and ticket.organization_id = ticket_attachments.organization_id
    )
    and exists (
      select 1 from public.files stored_file
      where stored_file.id = ticket_attachments.file_id
        and stored_file.organization_id = ticket_attachments.organization_id
        and stored_file.uploaded_by_user_id = (select auth.uid())
        and stored_file.status = 'available'
    )
    and (
      message_id is null
      or exists (
        select 1 from public.ticket_messages message
        where message.id = ticket_attachments.message_id
          and message.ticket_id = ticket_attachments.ticket_id
          and message.organization_id = ticket_attachments.organization_id
      )
    )
  );

drop policy if exists approvals_editor_insert on public.approvals;
create policy approvals_editor_insert on public.approvals for insert to authenticated
  with check (
    private.has_org_role(organization_id, array['owner', 'admin', 'editor'])
    and (
      deliverable_version_id is null
      or exists (
        select 1
        from public.deliverable_versions version
        join public.deliverables deliverable on deliverable.id = version.deliverable_id
        where version.id = approvals.deliverable_version_id
          and version.organization_id = approvals.organization_id
          and deliverable.project_id = approvals.project_id
      )
    )
  );

drop policy if exists approvals_editor_update on public.approvals;
create policy approvals_editor_update on public.approvals for update to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin', 'editor']))
  with check (
    private.has_org_role(organization_id, array['owner', 'admin', 'editor'])
    and (
      deliverable_version_id is null
      or exists (
        select 1
        from public.deliverable_versions version
        join public.deliverables deliverable on deliverable.id = version.deliverable_id
        where version.id = approvals.deliverable_version_id
          and version.organization_id = approvals.organization_id
          and deliverable.project_id = approvals.project_id
      )
    )
  );
