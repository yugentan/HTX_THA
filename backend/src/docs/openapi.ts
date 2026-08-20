import { TASK_STATUSES } from "../types/task.types";

const uuid = { type: "string", format: "uuid" } as const;

const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
    },
  },
});

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: uuid,
  description: "UUID of the resource",
};

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "HTX THA API",
    version: "1.0.0",
    description:
      "Task assignment API. Tasks may only be assigned to developers who " +
      "hold every skill the task requires.",
  },
  servers: [
    { url: "http://localhost:9000", description: "Docker" },
    { url: "http://localhost:3000", description: "Local (npm run dev)" },
  ],
  tags: [
    { name: "Health" },
    { name: "Tasks" },
    { name: "Developers" },
    { name: "Skills" },
  ],
  paths: {
    "/api/v1/health": {
      get: {
        tags: ["Health"],
        summary: "Liveness probe",
        responses: {
          "200": {
            description: "Service is up",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    uptime: { type: "number" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/tasks": {
      get: {
        tags: ["Tasks"],
        summary: "List tasks",
        responses: {
          "200": {
            description: "All tasks ordered by ordering",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Task" },
                },
              },
            },
          },
          "500": errorResponse("Database error"),
        },
      },
      post: {
        tags: ["Tasks"],
        summary: "Create a task",
        description:
          "If assigned_to is supplied, the developer must hold every skill " +
          "listed in skill_ids, otherwise the request is rejected with 409.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTask" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Task" },
              },
            },
          },
          "400": errorResponse(
            "Validation failed, or an unknown skill_id / parent_id was referenced"
          ),
          "409": errorResponse(
            "Developer is missing skills required by the task"
          ),
          "500": errorResponse("Database error"),
        },
      },
    },

    "/api/v1/tasks/{id}": {
      get: {
        tags: ["Tasks"],
        summary: "Read a task",
        parameters: [idParam],
        responses: {
          "200": {
            description: "The task with its skills, assignee and subtasks",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Task" },
              },
            },
          },
          "400": errorResponse("id is not a UUID"),
          "404": errorResponse("Task not found"),
          "500": errorResponse("Database error"),
        },
      },
      patch: {
        tags: ["Tasks"],
        summary: "Update a task",
        description:
          "Partial update. Reassignment is rejected with 409 unless the " +
          "developer holds every skill the task requires. When skill_ids " +
          "and assigned_to change together, the new skill set is checked.",
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateTask" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated task",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Task" },
              },
            },
          },
          "400": errorResponse(
            "Validation failed, or an unknown skill_id / parent_id / developer was referenced"
          ),
          "404": errorResponse("Task not found"),
          "409": errorResponse(
            "Developer is missing skills required by the task"
          ),
          "500": errorResponse("Database error"),
        },
      },
    },

    "/api/v1/developers": {
      get: {
        tags: ["Developers"],
        summary: "List developers",
        responses: {
          "200": {
            description: "All developers ordered by name",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Developer" },
                },
              },
            },
          },
          "500": errorResponse("Database error"),
        },
      },
    },

    "/api/v1/developers/{id}": {
      get: {
        tags: ["Developers"],
        summary: "Read a developer",
        parameters: [idParam],
        responses: {
          "200": {
            description: "The developer with their skills and assigned tasks",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Developer" },
              },
            },
          },
          "400": errorResponse("id is not a UUID"),
          "404": errorResponse("Developer not found"),
          "500": errorResponse("Database error"),
        },
      },
    },

    "/api/v1/skills": {
      get: {
        tags: ["Skills"],
        summary: "List skills",
        responses: {
          "200": {
            description: "All skills ordered by name",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Skill" },
                },
              },
            },
          },
          "500": errorResponse("Database error"),
        },
      },
    },

    "/api/v1/skills/{id}": {
      get: {
        tags: ["Skills"],
        summary: "Read a skill",
        parameters: [idParam],
        responses: {
          "200": {
            description: "The skill with its developers and tasks",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Skill" },
              },
            },
          },
          "400": errorResponse("id is not a UUID"),
          "404": errorResponse("Skill not found"),
          "500": errorResponse("Database error"),
        },
      },
    },
  },

  components: {
    schemas: {
      TaskStatus: {
        type: "string",
        enum: TASK_STATUSES,
        example: "to_do",
      },

      Reference: {
        type: "object",
        description: "Minimal reference to a related record",
        properties: { id: uuid, name: { type: "string" } },
      },

      TaskSummary: {
        type: "object",
        properties: {
          id: uuid,
          title: { type: "string" },
          status: { $ref: "#/components/schemas/TaskStatus" },
          ordering: { type: "integer" },
          parent_id: { ...uuid, nullable: true },
        },
      },

      Task: {
        type: "object",
        properties: {
          id: uuid,
          title: { type: "string", example: "both skills task" },
          status: { $ref: "#/components/schemas/TaskStatus" },
          ordering: { type: "integer", example: 0 },
          parent_id: {
            ...uuid,
            nullable: true,
            description: "null means the task is top level, not a subtask",
          },
          assigned_to: { ...uuid, nullable: true },
          assignee: {
            type: "string",
            nullable: true,
            description: "Name of the assigned developer",
          },
          skills: {
            type: "array",
            items: { $ref: "#/components/schemas/Reference" },
          },
          subtasks: {
            type: "array",
            items: { $ref: "#/components/schemas/TaskSummary" },
          },
        },
      },

      CreateTask: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", example: "new task" },
          status: { $ref: "#/components/schemas/TaskStatus" },
          ordering: { type: "integer", default: 0 },
          parent_id: { ...uuid, nullable: true },
          assigned_to: { ...uuid, nullable: true },
          skill_ids: { type: "array", items: uuid },
        },
      },

      UpdateTask: {
        type: "object",
        description:
          "Any subset of these fields. Send null to clear a nullable field.",
        properties: {
          title: { type: "string" },
          status: { $ref: "#/components/schemas/TaskStatus" },
          ordering: { type: "integer" },
          parent_id: { ...uuid, nullable: true },
          assigned_to: { ...uuid, nullable: true },
          skill_ids: {
            type: "array",
            items: uuid,
            description: "Replaces the skills of the task entirely",
          },
        },
      },

      Developer: {
        type: "object",
        properties: {
          id: uuid,
          name: { type: "string", example: "Carol" },
          skills: {
            type: "array",
            items: { $ref: "#/components/schemas/Reference" },
          },
          tasks: {
            type: "array",
            items: { $ref: "#/components/schemas/TaskSummary" },
          },
        },
      },

      Skill: {
        type: "object",
        properties: {
          id: uuid,
          name: { type: "string", example: "Frontend" },
          developers: {
            type: "array",
            items: { $ref: "#/components/schemas/Reference" },
          },
          tasks: {
            type: "array",
            items: { $ref: "#/components/schemas/TaskSummary" },
          },
        },
      },

      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          missing_skills: {
            type: "array",
            items: { type: "string" },
            description: "Present on 409 responses",
          },
          unknown_skill_ids: {
            type: "array",
            items: uuid,
            description: "Present when unknown skill_ids were supplied",
          },
        },
      },
    },
  },
};

export default openApiDocument;
