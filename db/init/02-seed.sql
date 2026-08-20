-- Seed data. Runs after 01-schema.sql on first initialization.
-- UUIDs are fixed (not generated) so IDs stay stable across resets.

--developers--
INSERT INTO developers (id, name) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Alice'),
    ('22222222-2222-2222-2222-222222222222', 'Bob'),
    ('33333333-3333-3333-3333-333333333333', 'Carol'),
    ('44444444-4444-4444-4444-444444444444', 'Dave');

--skills--
INSERT INTO skills (id, name) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Frontend'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Backend');

--developer_skill--
-- Alice: Frontend
-- Bob: Backend
-- Carol: Frontend, Backend
-- Dave: Backend
INSERT INTO developer_skill (developer_id, skill_id) VALUES
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

--tasks
INSERT INTO tasks (id, title, status, assigned_to, ordering, parent_id) VALUES
    ('cccccccc-0000-aaaa-bbbb-000000000001', 'both skills task', 'to_do','33333333-3333-3333-3333-333333333333', 0, NULL),
    ('cccccccc-0000-aaaa-aaaa-000000000002', 'frontend task', 'to_do', '11111111-1111-1111-1111-111111111111', 1, NULL),
    ('cccccccc-0000-bbbb-bbbb-000000000003', 'backend task', 'to_do', '22222222-2222-2222-2222-222222222222', 2, NULL);

--task_skill
-- skills implied by each task title
INSERT INTO task_skill (task_id, skill_id) VALUES
    ('cccccccc-0000-aaaa-bbbb-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('cccccccc-0000-aaaa-bbbb-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    ('cccccccc-0000-aaaa-aaaa-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('cccccccc-0000-bbbb-bbbb-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
