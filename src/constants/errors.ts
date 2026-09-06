export const ERRORS = {
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You don’t have permission to do that.',
  MISSING_ID: 'We couldn’t find what you were looking for. Please try again.',
  MISSING_FIELDS: 'Please fill in all required fields and try again.',
  UNEXPECTED: 'Something went wrong. Please try again.',
  DATABASE_UNREACHABLE: 'We’re having trouble connecting right now. Please try again in a moment.',
  DATABASE_TABLES_MISSING: 'We’re having trouble loading your data. Please try again later.',

  login: {
    missingEmailOrPassword: 'Please enter your email and password.',
    invalidCredentials: 'That email or password isn’t right. Please try again.',
    missingRefreshToken: 'Your session has ended. Please log in again.',
    invalidRefreshToken: 'Your session has ended. Please log in again.',
  },

  signup: {
    allFieldsRequired: 'Please fill in all the fields to create your account.',
    userExists: 'An account with this email already exists. Try logging in instead.',
    missingEmailOrPassword: 'Please enter your email and password.',
    missingEmail: 'Please enter your email address.',
    missingEmailOrOtp: 'Please enter your email and the code we sent you.',
    invalidOtp: 'That code isn’t right. Please check your email and try again.',
    otpNotVerified: 'Please enter the code we sent to your email before continuing.',
    passwordTooShort: 'Your password needs to be at least 6 characters.',
    failed: 'We couldn’t create your account. Please try again.',
  },

  password: {
    missingFields: 'Please fill in all password fields and try again.',
    invalidOldPassword: 'Your current password isn’t right. Please try again.',
    userNotFound: 'We couldn’t find an account with that email.',
    otpNotVerified: 'Please enter the code we sent you before choosing a new password.',
    invalidOrExpiredOtp: 'That code is incorrect or has expired. Please request a new one.',
  },

  validation: {
    missingEmail: 'Please enter your email address.',
    missingEmailOrOtp: 'Please enter your email and the code we sent you.',
    missingUsername: 'Please choose a username.',
    missingComment: 'Please write a comment first.',
    missingConversation: 'Please open a conversation first.',
    missingMessage: 'Please write a message first.',
    missingMessageOrEmoji: 'Please choose a message and a reaction.',
    missingFile: 'Please choose a photo to upload.',
    missingRequestId: 'We couldn’t find that friend request. Please try again.',
    missingFriendId: 'We couldn’t find that person. Please try again.',
    missingTargetUser: 'Please choose someone to send a friend request to.',
    missingProfilePicture: 'Please choose a photo to update your profile.',
    missingFollowIds: 'We couldn’t complete that follow. Please try again.',
    missingFriendshipUsers: 'We couldn’t update that friendship. Please try again.',
    missingCommentFields: 'Please write a comment first.',
  },

  user: {
    notFound: 'We couldn’t find that person.',
  },

  profile: {
    notFound: 'We couldn’t find that profile.',
    cannotFollowSelf: 'You can’t follow yourself.',
  },

  post: {
    notFound: 'This post is no longer available.',
    createFailed: 'We couldn’t share your post. Please try again.',
    updateFailed: 'We couldn’t update your post. Please try again.',
    deleteFailed: 'We couldn’t delete your post. Please try again.',
  },

  comment: {
    notFound: 'This comment is no longer available.',
    createFailed: 'We couldn’t post your comment. Please try again.',
    updateFailed: 'We couldn’t update your comment. Please try again.',
    deleteFailed: 'We couldn’t delete your comment. Please try again.',
  },

  friend: {
    requestNotFound: 'This friend request is no longer available.',
    alreadySent: 'You’ve already sent this person a friend request.',
    cannotFriendSelf: 'You can’t send a friend request to yourself.',
    notFound: 'This friendship is no longer available.',
    createFailed: 'We couldn’t add this friend. Please try again.',
    updateFailed: 'We couldn’t update this friendship. Please try again.',
    deleteFailed: 'We couldn’t remove this friend. Please try again.',
  },

  follow: {
    notFound: 'You’re not following this person.',
    createFailed: 'We couldn’t follow this person. Please try again.',
    updateFailed: 'We couldn’t update that. Please try again.',
    deleteFailed: 'We couldn’t unfollow this person. Please try again.',
  },

  chat: {
    notFound: 'This chat is no longer available.',
    conversationNotFound: 'This conversation is no longer available.',
    messageNotFound: 'This message is no longer available.',
    acceptRequestToReply: 'Accept the message request to reply.',
    notPendingRequest: 'This message request is no longer waiting for a response.',
    onlyRecipientCanRespond: 'Only you can accept or decline this message request.',
    onlySenderCanUnsend: 'You can only unsend your own messages.',
    invalidAction: 'That didn’t work. Please try again.',
  },

  notification: {
    notFound: 'This notification is no longer available.',
  },

  upload: {
    noFile: 'Please choose a photo to upload.',
    storageNotConfigured: 'Photo storage isn’t connected yet. Connect the Blob store to the backend project and redeploy.',
    failed: 'We couldn’t save that photo. Please try again later.',
  },

  email: {
    notConfigured: 'We couldn’t send the email right now. Please try again later.',
    sendFailed: 'We couldn’t send the email. Please try again later.',
  },

  history: {
    notFound: 'We couldn’t find that photo.',
    createFailed: 'We couldn’t save your photo. Please try again.',
    updateFailed: 'We couldn’t update your photo. Please try again.',
    deleteFailed: 'We couldn’t remove that photo. Please try again.',
  },
} as const;

export function errorFromUnknown(_error: unknown, fallback: string) {
  return fallback;
}
