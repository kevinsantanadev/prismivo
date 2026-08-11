-- Índices de apoio às chaves estrangeiras introduzidas no Marco 10.

create index deliverables_created_by_idx on public.deliverables(created_by_user_id);
create index deliverable_versions_created_by_idx on public.deliverable_versions(created_by_user_id);
create index deliverable_comments_author_idx on public.deliverable_comments(author_user_id);
create index ticket_attachments_uploaded_by_idx on public.ticket_attachments(uploaded_by_user_id);
