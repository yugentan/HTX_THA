-- Runs automatically on first initialization of an empty data directory.

--developers--
CREATE TABLE developers (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

--skills--
CREATE TABLE skills (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

--tasks--
-- parent_id NULL means the task is a parent (top level) rather than a subtask
CREATE TABLE tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    status      TEXT NOT NULL CHECK (status IN ('to_do', 'doing', 'done')),
    assigned_to UUID REFERENCES developers (id) ON DELETE SET NULL,
    ordering    INTEGER NOT NULL DEFAULT 0,
    parent_id   UUID REFERENCES tasks (id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_assigned_to ON tasks (assigned_to);
CREATE INDEX idx_tasks_parent_id ON tasks (parent_id);

--developer_skill (pairing)--
CREATE TABLE developer_skill (
    developer_id UUID NOT NULL REFERENCES developers (id) ON DELETE CASCADE,
    skill_id     UUID NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
    PRIMARY KEY (developer_id, skill_id)
);

CREATE INDEX idx_developer_skill_skill_id ON developer_skill (skill_id);

--task_skill (pairing)--
CREATE TABLE task_skill (
    task_id  UUID NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, skill_id)
);

CREATE INDEX idx_task_skill_skill_id ON task_skill (skill_id);
