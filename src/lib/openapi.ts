type SchemaObject = Record<string, unknown>;
type OperationObject = Record<string, unknown>;
type PathItemObject = Record<string, OperationObject>;

export type OpenApiDocument = {
  openapi: string;
  info: Record<string, unknown>;
  servers: Array<{ url: string; description: string }>;
  tags: Array<{ name: string; description: string }>;
  components: Record<string, unknown>;
  paths: Record<string, PathItemObject>;
};

const ErrorBody: SchemaObject = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
  },
};

const SuccessMessage: SchemaObject = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    success: { type: 'boolean' },
  },
};

function json(schema: SchemaObject, example?: unknown) {
  return {
    content: {
      'application/json': {
        schema,
        ...(example !== undefined ? { example } : {}),
      },
    },
  };
}

function responses(successStatus: number, successSchema: SchemaObject, extras: Record<string, unknown> = {}) {
  return {
    [String(successStatus)]: { description: 'Success', ...json(successSchema) },
    '400': { description: 'Bad request', ...json(ErrorBody) },
    '401': { description: 'Please log in', ...json(ErrorBody) },
    '404': { description: 'Not found', ...json(ErrorBody) },
    '500': { description: 'Server error', ...json(ErrorBody) },
    ...extras,
  };
}

function bearer() {
  return [{ bearerAuth: [] }];
}

function idParam(name = 'id', description = 'Resource ID') {
  return {
    name,
    in: 'path',
    required: true,
    schema: { type: 'string' },
    description,
  };
}

function queryId() {
  return {
    name: 'id',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description: 'Optional ID. When set, returns one item instead of a list.',
  };
}

function op(partial: OperationObject): OperationObject {
  return partial;
}

export function buildOpenApiSpec(serverUrl: string): OpenApiDocument {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Worldbook API',
      version: '1.0.0',
      description:
        'REST API for Worldbook. Click **Authorize** and paste the JWT from `POST /api/auth/login` as `Bearer <token>`.',
    },
    servers: [{ url: serverUrl, description: 'This environment' }],
    tags: [
      { name: 'Auth', description: 'Signup, login, password, and current user' },
      { name: 'Users', description: 'User search and accounts' },
      { name: 'Profiles', description: 'Profiles, follow lists, and public pages' },
      { name: 'Posts', description: 'Feed, posts, likes, and comments' },
      { name: 'Comments', description: 'Standalone comment CRUD' },
      { name: 'Friends', description: 'Friend requests and friendships' },
      { name: 'Follow', description: 'Follow relationships' },
      { name: 'Chat', description: 'Conversations, messages, and reactions' },
      { name: 'Notifications', description: 'In-app notifications' },
      { name: 'Uploads', description: 'Image uploads' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT from login. Swagger will send `Authorization: Bearer <token>`.',
        },
      },
      schemas: {
        Error: ErrorBody,
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        SignupStartRequest: {
          type: 'object',
          required: ['firstname', 'lastname', 'birthday', 'gender', 'email'],
          properties: {
            firstname: { type: 'string' },
            lastname: { type: 'string' },
            birthday: { type: 'string', format: 'date' },
            gender: { type: 'string', example: 'male' },
            email: { type: 'string', format: 'email' },
          },
        },
        EmailOtpRequest: {
          type: 'object',
          required: ['email', 'otp'],
          properties: {
            email: { type: 'string', format: 'email' },
            otp: { type: 'string', example: '123456' },
          },
        },
      },
    },
    paths: {
      '/api/auth/signup/start': {
        post: op({
          tags: ['Auth'],
          summary: 'Start signup and email an OTP',
          requestBody: json(
            { $ref: '#/components/schemas/SignupStartRequest' },
            {
              firstname: 'Ada',
              lastname: 'Lovelace',
              birthday: '1998-01-15',
              gender: 'female',
              email: 'ada@example.com',
            }
          ),
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/auth/signup/verify-otp': {
        post: op({
          tags: ['Auth'],
          summary: 'Verify signup OTP',
          requestBody: json({ $ref: '#/components/schemas/EmailOtpRequest' }),
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/auth/signup/complete-registration': {
        post: op({
          tags: ['Auth'],
          summary: 'Finish signup with a password (preferred)',
          description: 'Creates the user and profile after the email OTP is verified.',
          requestBody: json({
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 6 },
            },
          }),
          responses: responses(200, { type: 'object' }),
        }),
      },
      '/api/auth/signup/complete': {
        post: op({
          tags: ['Auth'],
          summary: 'Finish signup without a chosen password',
          description: 'Legacy complete step. Prefer `/api/auth/signup/complete-registration`.',
          requestBody: json({
            type: 'object',
            required: ['email'],
            properties: { email: { type: 'string', format: 'email' } },
          }),
          responses: responses(200, { type: 'object' }),
        }),
      },
      '/api/auth/signup': {
        post: op({
          tags: ['Auth'],
          summary: 'Create a user in one step (legacy)',
          requestBody: json({
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string' },
              firstname: { type: 'string' },
              lastname: { type: 'string' },
              birthday: { type: 'string' },
              gender: { type: 'string' },
            },
          }),
          responses: responses(201, { type: 'object' }),
        }),
      },
      '/api/auth/login': {
        post: op({
          tags: ['Auth'],
          summary: 'Log in and get a JWT',
          requestBody: json(
            { $ref: '#/components/schemas/LoginRequest' },
            { email: 'ada@example.com', password: 'secret123' }
          ),
          responses: responses(200, {
            type: 'object',
            properties: {
              token: { type: 'string' },
              access: { type: 'string' },
              refresh: { type: 'string' },
              user: { type: 'object' },
            },
          }),
        }),
      },
      '/api/auth/refresh': {
        post: op({
          tags: ['Auth'],
          summary: 'Refresh an access token',
          requestBody: json({
            type: 'object',
            properties: {
              refresh: { type: 'string' },
              refreshToken: { type: 'string' },
            },
          }),
          responses: responses(200, { type: 'object' }),
        }),
      },
      '/api/auth/me': {
        get: op({
          tags: ['Auth'],
          summary: 'Current logged-in user',
          security: bearer(),
          responses: responses(200, { type: 'object' }),
        }),
      },
      '/api/auth/request-password-reset': {
        post: op({
          tags: ['Auth'],
          summary: 'Email a password-reset OTP',
          requestBody: json({
            type: 'object',
            required: ['email'],
            properties: { email: { type: 'string', format: 'email' } },
          }),
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/auth/verify-reset-otp': {
        post: op({
          tags: ['Auth'],
          summary: 'Verify password-reset OTP',
          requestBody: json({ $ref: '#/components/schemas/EmailOtpRequest' }),
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/auth/reset-password': {
        post: op({
          tags: ['Auth'],
          summary: 'Set a new password after OTP',
          requestBody: json({
            type: 'object',
            required: ['email'],
            properties: {
              email: { type: 'string', format: 'email' },
              new_password: { type: 'string' },
              newPassword: { type: 'string' },
            },
          }),
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/auth/change-password': {
        post: op({
          tags: ['Auth'],
          summary: 'Change password while logged in',
          security: bearer(),
          requestBody: json({
            type: 'object',
            properties: {
              old_password: { type: 'string' },
              oldPassword: { type: 'string' },
              new_password: { type: 'string' },
              newPassword: { type: 'string' },
            },
          }),
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/user': {
        get: op({
          tags: ['Users'],
          summary: 'List users or get one by id',
          security: bearer(),
          parameters: [queryId()],
          responses: responses(200, { type: 'array', items: { type: 'object' } }),
        }),
        delete: op({
          tags: ['Users'],
          summary: 'Delete the current account',
          security: bearer(),
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/user/search': {
        get: op({
          tags: ['Users'],
          summary: 'Search users',
          security: bearer(),
          parameters: [
            {
              name: 'query',
              in: 'query',
              schema: { type: 'string' },
              description: 'Name, email, or username. `q` also works.',
            },
            { name: 'q', in: 'query', schema: { type: 'string' } },
          ],
          responses: responses(200, { type: 'array', items: { type: 'object' } }),
        }),
      },
      '/api/user/others': {
        get: op({
          tags: ['Users'],
          summary: 'List other users’ profiles',
          security: bearer(),
          responses: responses(200, { type: 'array', items: { type: 'object' } }),
        }),
      },
      '/api/profile': {
        get: op({
          tags: ['Profiles'],
          summary: 'List other profiles, or get one by id',
          security: bearer(),
          parameters: [queryId()],
          responses: responses(200, { type: 'object' }),
        }),
        post: op({
          tags: ['Profiles'],
          summary: 'Create a profile for the current user',
          security: bearer(),
          requestBody: json({
            type: 'object',
            required: ['username'],
            properties: {
              username: { type: 'string' },
              bio: { type: 'string' },
              profile_picture: { type: 'string' },
              profilePicture: { type: 'string' },
            },
          }),
          responses: responses(201, { type: 'object' }),
        }),
        put: op({
          tags: ['Profiles'],
          summary: 'Update current profile',
          security: bearer(),
          requestBody: json({
            type: 'object',
            properties: {
              username: { type: 'string' },
              bio: { type: 'string' },
              profile_picture: { type: 'string' },
              cover_photo: { type: 'string' },
              gender: { type: 'string' },
            },
          }),
          responses: responses(200, { type: 'object' }),
        }),
        patch: op({
          tags: ['Profiles'],
          summary: 'Partially update current profile',
          security: bearer(),
          requestBody: json({
            type: 'object',
            properties: {
              username: { type: 'string' },
              bio: { type: 'string' },
              profile_picture: { type: 'string' },
              cover_photo: { type: 'string' },
              gender: { type: 'string' },
            },
          }),
          responses: responses(200, { type: 'object' }),
        }),
        delete: op({
          tags: ['Profiles'],
          summary: 'Delete current profile',
          security: bearer(),
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/profile/me': {
        get: op({
          tags: ['Profiles'],
          summary: 'Current user’s profile',
          security: bearer(),
          responses: responses(200, { type: 'object' }),
        }),
      },
      '/api/profile/{id}/public': {
        get: op({
          tags: ['Profiles'],
          summary: 'Public profile by id',
          parameters: [idParam('id', 'Profile or user ID')],
          responses: responses(200, { type: 'object' }),
        }),
      },
      '/api/profile/{id}/friends': {
        get: op({
          tags: ['Profiles'],
          summary: 'Friends of a profile',
          parameters: [idParam('id', 'Profile ID')],
          responses: responses(200, { type: 'array', items: { type: 'object' } }),
        }),
      },
      '/api/profile/{id}/followers': {
        get: op({
          tags: ['Profiles'],
          summary: 'Followers of a profile',
          parameters: [idParam('id', 'Profile ID')],
          responses: responses(200, { type: 'array', items: { type: 'object' } }),
        }),
      },
      '/api/profile/{id}/following': {
        get: op({
          tags: ['Profiles'],
          summary: 'Accounts a profile follows',
          parameters: [idParam('id', 'Profile ID')],
          responses: responses(200, { type: 'array', items: { type: 'object' } }),
        }),
      },
      '/api/profile/{id}/follow': {
        post: op({
          tags: ['Follow'],
          summary: 'Follow a profile',
          security: bearer(),
          parameters: [idParam('id', 'Profile or user ID')],
          responses: responses(200, SuccessMessage),
        }),
        delete: op({
          tags: ['Follow'],
          summary: 'Unfollow a profile',
          security: bearer(),
          parameters: [idParam('id', 'Profile or user ID')],
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/profile-picture-history': {
        get: op({
          tags: ['Profiles'],
          summary: 'List profile picture history',
          parameters: [queryId()],
          responses: responses(200, { type: 'object' }),
        }),
        post: op({
          tags: ['Profiles'],
          summary: 'Add a history entry',
          requestBody: json({ type: 'object' }),
          responses: responses(201, { type: 'object' }),
        }),
        put: op({
          tags: ['Profiles'],
          summary: 'Update a history entry',
          parameters: [queryId()],
          requestBody: json({ type: 'object' }),
          responses: responses(200, { type: 'object' }),
        }),
        delete: op({
          tags: ['Profiles'],
          summary: 'Delete a history entry',
          parameters: [queryId()],
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/post': {
        get: op({
          tags: ['Posts'],
          summary: 'List posts or get one by id',
          security: bearer(),
          parameters: [queryId()],
          responses: responses(200, { type: 'array', items: { type: 'object' } }),
        }),
        post: op({
          tags: ['Posts'],
          summary: 'Create a post',
          security: bearer(),
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    content: { type: 'string' },
                    visibility: { type: 'string', example: 'public' },
                    images: { type: 'array', items: { type: 'string' } },
                    taggedProfiles: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    content: { type: 'string' },
                    visibility: { type: 'string' },
                    image: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: responses(201, { type: 'object' }),
        }),
      },
      '/api/post/feed': {
        get: op({
          tags: ['Posts'],
          summary: 'Home feed',
          security: bearer(),
          responses: responses(200, { type: 'array', items: { type: 'object' } }),
        }),
      },
      '/api/post/{id}': {
        get: op({
          tags: ['Posts'],
          summary: 'Get a post',
          parameters: [idParam('id', 'Post ID')],
          responses: responses(200, { type: 'object' }),
        }),
        put: op({
          tags: ['Posts'],
          summary: 'Update a post',
          security: bearer(),
          parameters: [idParam('id', 'Post ID')],
          requestBody: json({
            type: 'object',
            properties: {
              content: { type: 'string' },
              visibility: { type: 'string' },
            },
          }),
          responses: responses(200, { type: 'object' }),
        }),
        patch: op({
          tags: ['Posts'],
          summary: 'Partially update a post',
          security: bearer(),
          parameters: [idParam('id', 'Post ID')],
          requestBody: json({
            type: 'object',
            properties: {
              content: { type: 'string' },
              visibility: { type: 'string' },
            },
          }),
          responses: responses(200, { type: 'object' }),
        }),
        delete: op({
          tags: ['Posts'],
          summary: 'Delete a post',
          security: bearer(),
          parameters: [idParam('id', 'Post ID')],
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/post/{id}/like': {
        post: op({
          tags: ['Posts'],
          summary: 'Toggle like on a post',
          security: bearer(),
          parameters: [idParam('id', 'Post ID')],
          responses: responses(200, { type: 'object' }),
        }),
      },
      '/api/post/{id}/comments': {
        get: op({
          tags: ['Posts'],
          summary: 'Nested comments for a post',
          parameters: [idParam('id', 'Post ID')],
          responses: responses(200, { type: 'array', items: { type: 'object' } }),
        }),
        post: op({
          tags: ['Posts'],
          summary: 'Comment on a post',
          security: bearer(),
          parameters: [idParam('id', 'Post ID')],
          requestBody: json({
            type: 'object',
            required: ['comment'],
            properties: {
              comment: { type: 'string' },
              parent: { type: 'string' },
              parentId: { type: 'string' },
            },
          }),
          responses: responses(201, { type: 'object' }),
        }),
      },
      '/api/comment': {
        get: op({
          tags: ['Comments'],
          summary: 'List comments or get one by id',
          parameters: [queryId()],
          responses: responses(200, { type: 'object' }),
        }),
        post: op({
          tags: ['Comments'],
          summary: 'Create a comment',
          requestBody: json({
            type: 'object',
            required: ['profileId', 'postId', 'comment'],
            properties: {
              profileId: { type: 'string' },
              postId: { type: 'string' },
              comment: { type: 'string' },
              parentId: { type: 'string', nullable: true },
            },
          }),
          responses: responses(201, { type: 'object' }),
        }),
        put: op({
          tags: ['Comments'],
          summary: 'Update a comment',
          parameters: [queryId()],
          requestBody: json({ type: 'object' }),
          responses: responses(200, { type: 'object' }),
        }),
        delete: op({
          tags: ['Comments'],
          summary: 'Delete a comment',
          parameters: [queryId()],
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/comment/{id}': {
        patch: op({
          tags: ['Comments'],
          summary: 'Edit a comment by path id',
          security: bearer(),
          parameters: [idParam('id', 'Comment ID')],
          requestBody: json({
            type: 'object',
            properties: { comment: { type: 'string' } },
          }),
          responses: responses(200, { type: 'object' }),
        }),
        put: op({
          tags: ['Comments'],
          summary: 'Replace a comment by path id',
          security: bearer(),
          parameters: [idParam('id', 'Comment ID')],
          requestBody: json({ type: 'object' }),
          responses: responses(200, { type: 'object' }),
        }),
        delete: op({
          tags: ['Comments'],
          summary: 'Delete a comment by path id',
          security: bearer(),
          parameters: [idParam('id', 'Comment ID')],
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/friend-request': {
        get: op({
          tags: ['Friends'],
          summary: 'Incoming pending friend requests',
          security: bearer(),
          responses: responses(200, { type: 'array', items: { type: 'object' } }),
        }),
        post: op({
          tags: ['Friends'],
          summary: 'Send a friend request',
          security: bearer(),
          requestBody: json({
            type: 'object',
            properties: {
              to_user_id: { type: 'string' },
              toUserId: { type: 'string' },
              userId: { type: 'string' },
            },
          }),
          responses: responses(201, { type: 'object' }),
        }),
      },
      '/api/friend-request/sent': {
        get: op({
          tags: ['Friends'],
          summary: 'Outgoing friend requests',
          security: bearer(),
          responses: responses(200, { type: 'array', items: { type: 'object' } }),
        }),
      },
      '/api/friend-request/accept': {
        post: op({
          tags: ['Friends'],
          summary: 'Accept a friend request',
          security: bearer(),
          requestBody: json({
            type: 'object',
            properties: {
              request_id: { type: 'string' },
              requestId: { type: 'string' },
            },
          }),
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/friend-request/reject': {
        post: op({
          tags: ['Friends'],
          summary: 'Reject a friend request',
          security: bearer(),
          requestBody: json({
            type: 'object',
            properties: {
              request_id: { type: 'string' },
              requestId: { type: 'string' },
            },
          }),
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/friend-request/cancel': {
        post: op({
          tags: ['Friends'],
          summary: 'Cancel a sent friend request',
          security: bearer(),
          requestBody: json({
            type: 'object',
            properties: {
              request_id: { type: 'string' },
              requestId: { type: 'string' },
              id: { type: 'string' },
            },
          }),
          responses: responses(200, SuccessMessage),
        }),
        delete: op({
          tags: ['Friends'],
          summary: 'Cancel a sent friend request',
          security: bearer(),
          requestBody: json({
            type: 'object',
            properties: {
              request_id: { type: 'string' },
              requestId: { type: 'string' },
            },
          }),
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/friend-request/cancel/{id}': {
        delete: op({
          tags: ['Friends'],
          summary: 'Cancel a friend request by id',
          security: bearer(),
          parameters: [idParam('id', 'Friend request ID')],
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/friends': {
        get: op({
          tags: ['Friends'],
          summary: 'Current user’s friends',
          security: bearer(),
          responses: responses(200, { type: 'array', items: { type: 'object' } }),
        }),
      },
      '/api/friends/delete': {
        post: op({
          tags: ['Friends'],
          summary: 'Unfriend someone',
          security: bearer(),
          requestBody: json({
            type: 'object',
            properties: {
              friend_id: { type: 'string' },
              friendId: { type: 'string' },
            },
          }),
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/friendship': {
        get: op({
          tags: ['Friends'],
          summary: 'List friendships',
          parameters: [queryId()],
          responses: responses(200, { type: 'object' }),
        }),
        post: op({
          tags: ['Friends'],
          summary: 'Create a friendship record',
          requestBody: json({ type: 'object' }),
          responses: responses(201, { type: 'object' }),
        }),
        put: op({
          tags: ['Friends'],
          summary: 'Update a friendship',
          parameters: [queryId()],
          requestBody: json({ type: 'object' }),
          responses: responses(200, { type: 'object' }),
        }),
        delete: op({
          tags: ['Friends'],
          summary: 'Delete a friendship',
          parameters: [queryId()],
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/follow': {
        get: op({
          tags: ['Follow'],
          summary: 'List follows or get one by id',
          parameters: [queryId()],
          responses: responses(200, { type: 'object' }),
        }),
        post: op({
          tags: ['Follow'],
          summary: 'Create a follow',
          requestBody: json({
            type: 'object',
            required: ['followerId', 'followingId'],
            properties: {
              followerId: { type: 'string' },
              followingId: { type: 'string' },
            },
          }),
          responses: responses(201, { type: 'object' }),
        }),
        put: op({
          tags: ['Follow'],
          summary: 'Update a follow',
          parameters: [queryId()],
          requestBody: json({ type: 'object' }),
          responses: responses(200, { type: 'object' }),
        }),
        delete: op({
          tags: ['Follow'],
          summary: 'Delete a follow',
          parameters: [queryId()],
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/conversation': {
        get: op({
          tags: ['Chat'],
          summary: 'List conversations',
          security: bearer(),
          responses: responses(200, { type: 'array', items: { type: 'object' } }),
        }),
        post: op({
          tags: ['Chat'],
          summary: 'Start or reuse a conversation',
          security: bearer(),
          requestBody: json({
            type: 'object',
            properties: {
              participants: { type: 'array', items: { type: 'string' } },
              participantIds: { type: 'array', items: { type: 'string' } },
              name: { type: 'string' },
              is_group: { type: 'boolean' },
              isGroup: { type: 'boolean' },
            },
          }),
          responses: responses(201, { type: 'object' }),
        }),
      },
      '/api/conversation/{id}': {
        get: op({
          tags: ['Chat'],
          summary: 'Get a conversation',
          security: bearer(),
          parameters: [idParam('id', 'Conversation ID')],
          responses: responses(200, { type: 'object' }),
        }),
        patch: op({
          tags: ['Chat'],
          summary: 'Accept or decline a message request',
          security: bearer(),
          parameters: [idParam('id', 'Conversation ID')],
          requestBody: json({
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['accept', 'decline'] },
            },
          }),
          responses: responses(200, { type: 'object' }),
        }),
        delete: op({
          tags: ['Chat'],
          summary: 'Leave or delete a conversation',
          security: bearer(),
          parameters: [idParam('id', 'Conversation ID')],
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/message': {
        get: op({
          tags: ['Chat'],
          summary: 'Messages in a conversation',
          security: bearer(),
          parameters: [
            {
              name: 'conversation',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: '`conversationId` also works.',
            },
          ],
          responses: responses(200, { type: 'array', items: { type: 'object' } }),
        }),
        post: op({
          tags: ['Chat'],
          summary: 'Send a message',
          security: bearer(),
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    conversation: { type: 'string' },
                    conversationId: { type: 'string' },
                    text: { type: 'string' },
                    gif_url: { type: 'string' },
                    imageUrl: { type: 'string' },
                  },
                },
              },
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    conversation: { type: 'string' },
                    text: { type: 'string' },
                    image: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: responses(201, { type: 'object' }),
        }),
      },
      '/api/message/{id}': {
        patch: op({
          tags: ['Chat'],
          summary: 'Edit or hide a message',
          security: bearer(),
          parameters: [idParam('id', 'Message ID')],
          requestBody: json({ type: 'object' }),
          responses: responses(200, { type: 'object' }),
        }),
        put: op({
          tags: ['Chat'],
          summary: 'Update a message',
          security: bearer(),
          parameters: [idParam('id', 'Message ID')],
          requestBody: json({ type: 'object' }),
          responses: responses(200, { type: 'object' }),
        }),
      },
      '/api/reaction': {
        get: op({
          tags: ['Chat'],
          summary: 'Reactions on a message',
          security: bearer(),
          parameters: [
            {
              name: 'message',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: '`messageId` also works.',
            },
          ],
          responses: responses(200, { type: 'array', items: { type: 'object' } }),
        }),
        post: op({
          tags: ['Chat'],
          summary: 'Add a reaction',
          security: bearer(),
          requestBody: json({
            type: 'object',
            properties: {
              message: { type: 'string' },
              messageId: { type: 'string' },
              emoji: { type: 'string', example: '👍' },
            },
          }),
          responses: responses(201, { type: 'object' }),
        }),
      },
      '/api/chat': {
        get: op({
          tags: ['Chat'],
          summary: 'Get a chat by id (legacy)',
          parameters: [
            { name: 'id', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: responses(200, { type: 'object' }),
        }),
        post: op({
          tags: ['Chat'],
          summary: 'Send a chat message (legacy)',
          requestBody: json({
            type: 'object',
            required: ['senderId', 'receiverId', 'message'],
            properties: {
              senderId: { type: 'string' },
              receiverId: { type: 'string' },
              message: { type: 'string' },
            },
          }),
          responses: responses(201, { type: 'object' }),
        }),
      },
      '/api/notification': {
        get: op({
          tags: ['Notifications'],
          summary: 'List notifications',
          security: bearer(),
          responses: responses(200, { type: 'array', items: { type: 'object' } }),
        }),
        patch: op({
          tags: ['Notifications'],
          summary: 'Mark all notifications read',
          security: bearer(),
          requestBody: json({
            type: 'object',
            properties: {
              all_read: { type: 'boolean' },
              allRead: { type: 'boolean' },
            },
          }),
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/notification/{id}': {
        patch: op({
          tags: ['Notifications'],
          summary: 'Mark one notification read',
          security: bearer(),
          parameters: [idParam('id', 'Notification ID')],
          requestBody: json({
            type: 'object',
            properties: {
              is_read: { type: 'boolean' },
              isRead: { type: 'boolean' },
            },
          }),
          responses: responses(200, { type: 'object' }),
        }),
        delete: op({
          tags: ['Notifications'],
          summary: 'Delete a notification',
          security: bearer(),
          parameters: [idParam('id', 'Notification ID')],
          responses: responses(200, SuccessMessage),
        }),
      },
      '/api/upload': {
        post: op({
          tags: ['Uploads'],
          summary: 'Upload a generic image',
          security: bearer(),
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    image: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: responses(200, {
            type: 'object',
            properties: { url: { type: 'string' } },
          }),
        }),
      },
      '/api/upload/profile-picture': {
        post: op({
          tags: ['Uploads'],
          summary: 'Upload a profile picture',
          security: bearer(),
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    profile_picture: { type: 'string', format: 'binary' },
                    file: { type: 'string', format: 'binary' },
                    image: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: responses(200, { type: 'object' }),
        }),
      },
      '/api/upload/cover-photo': {
        post: op({
          tags: ['Uploads'],
          summary: 'Upload a cover photo',
          security: bearer(),
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    cover_photo: { type: 'string', format: 'binary' },
                    file: { type: 'string', format: 'binary' },
                    image: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: responses(200, { type: 'object' }),
        }),
      },
      '/api/upload/post-image': {
        post: op({
          tags: ['Uploads'],
          summary: 'Upload a post image',
          security: bearer(),
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    image: { type: 'string', format: 'binary' },
                    file: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: responses(200, { type: 'object' }),
        }),
      },
    },
  };
}
